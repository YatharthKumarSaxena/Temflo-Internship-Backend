const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { PROJECT_UPDATED } = require("@/config/activity.enums");

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

    let newData = {};
    let oldData = {};
    
    if (name){
      oldData.name = project.name;
      project.name = name;
      newData.name = name;
    } 
    if (description){
      oldData.description = project.description;
      project.description = description;
      newData.description = description;
    } 
    if (emoji){
      oldData.emoji = project.emoji;
      project.emoji = emoji;
      newData.emoji = emoji;
    } 
    if (links){
      oldData.links = project.links;
      project.links = links;
      newData.links = links;
    } 
    if (tags){
      oldData.tags = project.tags;
      project.tags = tags;
      newData.tags = tags;
    } 

    await project.save();

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
      newData: newData
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