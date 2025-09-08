const express = require('express');

const { catchErrors } = require('@/handlers/errorHandlers');

const router = express.Router();
const workspaceController = require('@/controllers/TaskManagerControllers/workspaceControllers');
const projectController = require('@/controllers/TaskManagerControllers/projectControllers');
const taskController = require('@/controllers/TaskManagerControllers/taskControllers');
const subtaskController = require('@/controllers/TaskManagerControllers/subtaskControllers');
const activityController = require('@/controllers/TaskManagerControllers/activityControllers');
const memberController = require('@/controllers/TaskManagerControllers/memberControllers');
const employeeWorkspaceController = require('@/controllers/TaskManagerControllers/employeeWorkspaceControllers');
const employeeProjectController = require('@/controllers/TaskManagerControllers/employeeProjectControllers');
const employeeTaskController = require('@/controllers/TaskManagerControllers/employeeTaskControllers');
const employeeSubtaskController = require('@/controllers/TaskManagerControllers/employeeSubtaskControllers');

// Workspace APIs
router.route('/workspace/create').post(catchErrors(workspaceController.create)); 
router.route('/workspace/list').get(catchErrors(workspaceController.paginatedList));
router.route('/workspace/read').get(catchErrors(workspaceController.read));
router.route('/workspace/read/w/:workspaceId').get(catchErrors(workspaceController.readW));
router
  .route('/workspace/update/:workspaceId')
  .put(catchErrors(workspaceController.updateWorkspace)); 
router.route('/workspace/delete/:workspaceId').delete(catchErrors(workspaceController.remove)); 

// Project APIs
router.route('/project/create/:workspaceId').post(catchErrors(projectController.create));
router.route('/project/list/:workspaceId').get(catchErrors(projectController.paginatedList)); 
router.route('/project/read').get(catchErrors(projectController.read));
router.route('/project/read/p/:projectId').get(catchErrors(projectController.readP));
router.route('/project/read/w/:workspaceId').get(catchErrors(projectController.readW));
router.route('/project/update/:projectId').put(catchErrors(projectController.updateProject)); 
router.route('/project/delete/:projectId').delete(catchErrors(projectController.remove)); 

// Task APIs
router.route('/task/create/:projectId').post(catchErrors(taskController.create)); 
router.route('/task/list/:projectId').get(catchErrors(taskController.paginatedList));
router.route('/task/read').get(catchErrors(taskController.read));
router.route('/task/read/w/:workspaceId').get(catchErrors(taskController.readW));
router.route('/task/read/p/:projectId').get(catchErrors(taskController.readP));
router.route('/task/read/t/:taskId').get(catchErrors(taskController.readT));
router.route('/task/update/:taskId').put(catchErrors(taskController.updateTask)); 
router.route('/task/delete/:taskId').delete(catchErrors(taskController.remove)); 
router.route('/task/count/:projectId').get(catchErrors(taskController.count));

// Task File Upload APIs
router.route('/task/upload/:taskId').post(catchErrors(taskController.uploadAttachment));
router.route('/task/attachment/:taskId/:attachmentId').delete(catchErrors(taskController.deleteAttachment));

// Project File Upload APIs
router.route('/project/upload/:projectId').post(catchErrors(projectController.uploadAttachment));
router.route('/project/attachment/:projectId/:attachmentId').delete(catchErrors(projectController.deleteAttachment));

// Subtask File Upload APIs
router.route('/subtask/upload/:subtaskId').post(catchErrors(subtaskController.uploadAttachment));
router.route('/subtask/attachment/:subtaskId/:attachmentId').delete(catchErrors(subtaskController.deleteAttachment));

// Task APIs
router.route('/subtask/create/:taskId').post(catchErrors(subtaskController.create)); 
router.route('/subtask/list/:taskId').get(catchErrors(subtaskController.paginatedList));
router.route('/subtask/read').get(catchErrors(subtaskController.read));
router.route('/subtask/read/w/:workspaceId').get(catchErrors(subtaskController.readW));
router.route('/subtask/read/p/:projectId').get(catchErrors(subtaskController.readP));
router.route('/subtask/read/t/:taskId').get(catchErrors(subtaskController.readT));
router.route('/subtask/read/s/:subtaskId').get(catchErrors(subtaskController.readS));
router.route('/subtask/update/:subtaskId').put(catchErrors(subtaskController.updateTask)); 
router.route('/subtask/delete/:subtaskId').delete(catchErrors(subtaskController.remove)); 
router.route('/subtask/count/:taskId').get(catchErrors(subtaskController.count));



// Activity APIs
router.route('/activity/create').post(catchErrors(activityController.create));
router.route('/activity/:projectId').get(catchErrors(activityController.read));

// Member APIs
router.route('/member/add').post(catchErrors(memberController.create));
router.route('/member/read/p').post(catchErrors(memberController.readP)); //
router.route('/member/read/w').post(catchErrors(memberController.readW)); //
router.route('/member/remove/:userId').delete(catchErrors(memberController.remove));



// Employees APIs
router.route('/employee/workspace/read').post(catchErrors(employeeWorkspaceController.read))
router.route('/employee/workspace/read/w/:workspaceId').post(catchErrors(employeeWorkspaceController.readW))

router.route('/employee/project/read').get(catchErrors(employeeProjectController.read));
router.route('/employee/project/read/p/:projectId').get(catchErrors(employeeProjectController.readP));
router.route('/employee/project/read/w/:workspaceId').get(catchErrors(employeeProjectController.readW));

router.route('/employee/task/read').get(catchErrors(employeeTaskController.read));
router.route('/employee/task/read/p/:projectId').get(catchErrors(employeeTaskController.readP));
router.route('/employee/task/read/t/:taskId').get(catchErrors(employeeTaskController.readT));
router.route('/employee/task/update/:taskId').put(catchErrors(employeeTaskController.update)); 

router.route('/employee/subtask/read').get(catchErrors(employeeSubtaskController.read));
router.route('/employee/subtask/read/p/:projectId').get(catchErrors(employeeSubtaskController.readP));
router.route('/employee/subtask/read/t/:taskId').get(catchErrors(employeeSubtaskController.readT));
router.route('/employee/subtask/read/s/:subtaskId').get(catchErrors(employeeSubtaskController.readS));
router.route('/employee/subtask/update/:subtaskId').put(catchErrors(employeeSubtaskController.update)); 


module.exports = router;