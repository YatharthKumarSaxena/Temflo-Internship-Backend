const DepartmentAssignment = require('../../models/appModels/DepartmentAssignment');
const Department = require('../../models/appModels/Department');
const Plant = require('../../models/appModels/Plant');
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { DEPARTMENT_ASSIGNMENT_CREATED, DEPARTMENT_ASSIGNMENT_UPDATED } = require("@/config/activity.enums");
const { getFullName } = require("@/utils/commonFunctions");

class AssignmentController {
  // Create new department assignment
  async assignDepartment(req, res) {
    try {
      const { plantId, mainId } = req.body;

      // Validate required fields
      if (!plantId || !mainId) {
        return res.status(400).json({
          success: false,
          message: 'Plant ID and Department ID are required',
        });
      }

      // Validate plant exists
      const plant = await Plant.findOne({
        _id: plantId,
        companyId: req.admin.companyId,
        removed: false,
      });

      if (!plant) {
        return res.status(404).json({
          success: false,
          message: 'Plant not found',
        });
      }

      // Validate department exists
      const department = await Department.findOne({
        _id: mainId,
        companyId: req.admin.companyId,
        removed: false,
      });

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
        });
      }

      // Check if assignment already exists
      const existingAssignment = await DepartmentAssignment.findOne({
        plantId,
        mainId,
        companyId: req.admin.companyId,
        removed: false,
      });

      if (existingAssignment) {
        return res.status(400).json({
          success: false,
          message: 'Department is already assigned to this plant',
        });
      }

      // Create new assignment
      const assignment = new DepartmentAssignment({
        plantId,
        mainId,
        companyId: req.admin.companyId,
      });

      await assignment.save();

      // Populate the assignment with plant and department details
      const populatedAssignment = await DepartmentAssignment.findById(assignment._id)
        .populate('plantId', 'name plantCode')
        .populate('mainId', 'departmentCode description');

      // ---- ACTIVITY TRACKER ----
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.app,
        subModuleAffected: null, // As per requirement
        fileAffected: FILE.file_assignment,
        modelAffected: [MODEL_AFFECTED.model_departmentAssignment],
        eventType: DEPARTMENT_ASSIGNMENT_CREATED,
        actionDone: ACTIONS.create,
        oldData: null, // ✅ Correct for creation
        newData: assignment.toObject(), // ✅ Complete snapshot
        description: `Department '${department.departmentCode}' assigned to Plant '${plant.plantCode}' by ${getFullName(req.admin.employeeInfo)}`
      });

      res.status(201).json({
        success: true,
        message: 'Department assigned to plant successfully',
        result: populatedAssignment,
      });
    } catch (error) {
      console.error('Assignment creation error:', error);

      // Handle duplicate key error specifically
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'This department is already assigned to the selected plant',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get all department assignments for a plant
  async getDepartmentAssignments(req, res) {
    try {
      const { plantId } = req.params;

      // If no plantId provided, return all assignments for the company
      if (!plantId || plantId === 'undefined') {
        const assignments = await DepartmentAssignment.find({
          companyId: req.admin.companyId,
          removed: false,
        })
          .populate('plantId', 'name plantCode')
          .populate('mainId', 'departmentCode description')
          .sort({ created: -1 });

        return res.status(200).json({
          success: true,
          result: assignments,
        });
      }

      const assignments = await DepartmentAssignment.find({
        plantId,
        companyId: req.admin.companyId,
        removed: false,
      })
        .populate('plantId', 'name plantCode')
        .populate('mainId', 'departmentCode description')
        .sort({ created: -1 });

      res.status(200).json({
        success: true,
        result: assignments,
      });
    } catch (error) {
      console.error('Get assignments error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Update department assignment
  async updateDepartmentAssignment(req, res) {
    try {
      const { assignmentId } = req.params;
      const { plantId, mainId } = req.body;

      // Validate required fields
      if (!plantId || !mainId) {
        return res.status(400).json({
          success: false,
          message: 'Plant ID and Department ID are required',
        });
      }

      // Check if assignment exists
      const existingAssignment = await DepartmentAssignment.findOne({
        _id: assignmentId,
        companyId: req.admin.companyId,
        removed: false,
      });

      if (!existingAssignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found',
        });
      }

      // Validate plant exists
      const plant = await Plant.findOne({
        _id: plantId,
        companyId: req.admin.companyId,
        removed: false,
      });

      if (!plant) {
        return res.status(404).json({
          success: false,
          message: 'Plant not found',
        });
      }

      // Validate department exists
      const department = await Department.findOne({
        _id: mainId,
        companyId: req.admin.companyId,
        removed: false,
      });

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
        });
      }

      // Check if another assignment with same plant-department combination exists
      const duplicateAssignment = await DepartmentAssignment.findOne({
        plantId,
        mainId,
        companyId: req.admin.companyId,
        removed: false,
        _id: { $ne: assignmentId },
      });

      if (duplicateAssignment) {
        return res.status(400).json({
          success: false,
          message: 'Department is already assigned to this plant',
        });
      }

      // Get old data before update
      const oldData = existingAssignment.toObject();

      // Update assignment using save method to avoid extra DB calls
      existingAssignment.plantId = plantId;
      existingAssignment.mainId = mainId;
      existingAssignment.updated = new Date();
      await existingAssignment.save();

      // Populate the updated assignment
      const updatedAssignment = await DepartmentAssignment.findById(assignmentId)
        .populate('plantId', 'name plantCode')
        .populate('mainId', 'departmentCode description');

      // ---- ACTIVITY TRACKER ----
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.app,
        subModuleAffected: null, 
        fileAffected: FILE.file_assignment,
        modelAffected: [MODEL_AFFECTED.model_departmentAssignment],
        eventType: DEPARTMENT_ASSIGNMENT_UPDATED,
        actionDone: ACTIONS.update,
        oldData: oldData, // ✅ Complete snapshot before update
        newData: existingAssignment.toObject(), // ✅ Complete snapshot after update
        description: `Department assignment updated by ${getFullName(req.admin.employeeInfo)}`
      });

      res.status(200).json({
        success: true,
        message: 'Assignment updated successfully',
        result: updatedAssignment,
      });
    } catch (error) {
      console.error('Assignment update error:', error);

      // Handle duplicate key error specifically
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'This department is already assigned to the selected plant',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Delete department assignment
  async deleteDepartmentAssignment(req, res) {
    try {
      return res.status(404).json({
        success: false,
        message: 'You Can Not delete the Assigned Department',
      });

    } catch (error) {
      console.error('Update Admin Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get all assignments (for admin view)
  async getAllAssignments(req, res) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;

      const query = {
        companyId: req.admin.companyId,
        removed: false,
      };

      // Add search functionality
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
          { 'plantId.name': searchRegex },
          { 'mainId.departmentCode': searchRegex },
          { 'mainId.description': searchRegex },
        ];
      }

      const assignments = await DepartmentAssignment.find(query)
        .populate('plantId', 'name plantCode')
        .populate('mainId', 'departmentCode description')
        .sort({ created: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await DepartmentAssignment.countDocuments(query);

      res.status(200).json({
        success: true,
        result: assignments,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      });
    } catch (error) {
      console.error('Get all assignments error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

module.exports = new AssignmentController();
