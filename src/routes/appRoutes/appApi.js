const express = require('express');
const { catchErrors } = require('@/handlers/errorHandlers');
const router = express.Router();

const appControllers = require('@/controllers/appControllers');
const { routesList } = require('@/models/utils');
const requireReadAccess = require('@/middlewares/access/requireReadAccess')
const requireWriteAccess = require('@/middlewares/access/requireWriteAccess')
const checkPermission = require('@/middlewares/access/checkMiddleware')

const routerApp = (entity, controller) => {
  router.route(`/${entity}/create`).post(checkPermission(entity),requireWriteAccess,catchErrors(controller['create']));
  router.route(`/${entity}/read/:id`).get(checkPermission(entity),requireReadAccess,catchErrors(controller['read']));
  router.route(`/${entity}/update/:id`).patch(checkPermission(entity),requireWriteAccess,catchErrors(controller['update']));
  router.route(`/${entity}/delete/:id`).delete(checkPermission(entity),requireWriteAccess,catchErrors(controller['delete']));
  router.route(`/${entity}/search`).get(checkPermission(entity),requireReadAccess,catchErrors(controller['search']));
  router.route(`/${entity}/list`).get(checkPermission(entity),requireReadAccess,catchErrors(controller['list']));
  router.route(`/${entity}/listAll`).get(catchErrors(controller['listAll']));
  router.route(`/${entity}/filter`).get(checkPermission(entity),requireReadAccess,catchErrors(controller['filter']));
  router.route(`/${entity}/summary`).get(checkPermission(entity),requireReadAccess,catchErrors(controller['summary']));

  if (entity === 'invoice' || entity === 'quote' || entity === 'offer' || entity === 'payment') {
    router.route(`/${entity}/mail`).post(catchErrors(controller['mail']));
  }

  if (entity === 'quote') {
    router.route(`/${entity}/convert/:id`).get(catchErrors(controller['convert']));
  }
};

routesList.forEach(({ entity, controllerName }) => {
  const controller = appControllers[controllerName];
  routerApp(entity, controller);
});

module.exports = router;
