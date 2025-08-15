const express = require('express');

const { catchErrors } = require('@/handlers/errorHandlers');

const router = express.Router();
const workspaceController = require('@/controllers/TaskManagerControllers/workspaceControllers');
const projectController = require('@/controllers/TaskManagerControllers/projectControllers');
const taskController = require('@/controllers/TaskManagerControllers/taskControllers');
const activityController = require('@/controllers/TaskManagerControllers/activityControllers');
const memberController = require('@/controllers/TaskManagerControllers/memberControllers');

// Workspace APIs
router.route('/workspace/create').post(catchErrors(workspaceController.create)); // activity
router.route('/workspace/list').get(catchErrors(workspaceController.paginatedList));
router.route('/workspace/read').get(catchErrors(workspaceController.read));
router.route('/workspace/read/w/:workspaceId').get(catchErrors(workspaceController.readW));
router
  .route('/workspace/update/:workspaceId')
  .put(catchErrors(workspaceController.updateWorkspace)); // activity
router.route('/workspace/delete/:workspaceId').delete(catchErrors(workspaceController.remove)); // activity

// Project APIs
router.route('/project/create/:workspaceId').post(catchErrors(projectController.create)); // activity
router.route('/project/read').get(catchErrors(projectController.read));
router.route('/project/read/p/:projectId').get(catchErrors(projectController.readP));
router.route('/project/read/w/:workspaceId').get(catchErrors(projectController.readW));
router.route('/project/update/:projectId').put(catchErrors(projectController.updateProject)); // activity
router.route('/project/delete/:projectId').delete(catchErrors(projectController.remove)); // activity

// Task APIs
router.route('/task/create/:projectId').post(catchErrors(taskController.create)); // activity
router.route('/task/read').get(catchErrors(taskController.read));
router.route('/task/read/w/:workspaceId').get(catchErrors(taskController.readW));
router.route('/task/read/p/:projectId').get(catchErrors(taskController.readP));
router.route('/task/read/t/:taskId').get(catchErrors(taskController.readT));
router.route('/task/update/:taskId').put(catchErrors(taskController.updateTask)); // activity
router.route('/task/delete/:taskId').delete(catchErrors(taskController.remove)); // activity

// Activity APIs
router.route('/activity/create').post(catchErrors(activityController.create));
router.route('/activity/:projectId').get(catchErrors(activityController.read));

// MEMBER APIs
router.route('/member/add').post(catchErrors(memberController.create));
router.route('/member/read/p').post(catchErrors(memberController.readP)); //
router.route('/member/read/w').post(catchErrors(memberController.readW)); //
router.route('/member/remove/:userId').delete(catchErrors(memberController.remove));

module.exports = router;
