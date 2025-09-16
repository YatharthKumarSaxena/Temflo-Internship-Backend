const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { PROJECT_DELETED } = require("@/config/activity.enums");

const remove = async (req, res) => {
  // params projectId
  try {
    const Project = mongoose.model('Project');
    const Task = mongoose.model('Task');

    const project = await Project.findOne({ _id: req.params.projectId, removed: false });

    if (!project) {
        return res.status(404).json({
        success: false,
        message: 'No Project Found To Delete',
      });
    }

    const task = await Task.find({ projectId: req.params.projectId, removed: false });

    // To Delete Task
    task?.map(async (taskId) => {
        const task = await Task.findOne({_id:taskId})
        task.removed = true
        await task.save()
    })

    // To Delete Project
    project.removed = true 
    await project.save()

    // Activity tracker for Member soft delete
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.taskManager,
      subModuleAffected: SUBMODULE.project,
      fileAffected: FILE.file_remove_project,
      modelAffected: [MODEL_AFFECTED.model_project],
      eventType: PROJECT_DELETED,
      actionDone: ACTIONS.delete,
      oldData: project.toObject(),
      newData: {
        note: "All fields same as Old Data, Soft deletion is Done",
        removed: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Project Deleted Successfully',
    });
  } catch (error) {
    console.error('Project Deletion Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = remove;