const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { PROJECT_UPDATED } = require("@/config/activity.enums");
const { getFullName } = require("@/utils/commonFunctions");

const update = async (req, res) => {
  // params projectId
  try {
    const Project = mongoose.model('Project');

    const { name, description, emoji, links, tags } = req.body;

    const project = await Project.findOne({ _id: req.params.projectId });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'No Project Found To Update',
      });
    }

    let oldData = project.toObject();
    
    if (name){
      project.name = name;
    } 
    if (description){
      project.description = description;
    } 
    if (emoji){
      project.emoji = emoji;
    } 
    if (links){
      project.links = links;
    } 
    if (tags){
      project.tags = tags;
    } 

    await project.save();

    const newData = project.toObject();
    
    // 🔹 Activity Tracker logging
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.taskManager,
      subModuleAffected: SUBMODULE.project,
      fileAffected: FILE.file_update_project,
      modelAffected: [MODEL_AFFECTED.model_project],
      eventType: PROJECT_UPDATED,
      actionDone: ACTIONS.update,
      oldData: oldData,
      newData: newData,
      description: `Project updated by ${getFullName(req.admin.employeeInfo)}`
    });

    return res.status(200).json({
      success: true,
      message: 'Project Updated Successfully',
    });
  } catch (error) {
    console.error('Project Updation Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = update;