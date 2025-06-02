const express = require('express');

const cors = require('cors');
const compression = require('compression');

const cookieParser = require('cookie-parser');

const coreAuthRouter = require('./routes/coreRoutes/coreAuth');
// const userAuthRouter = require('./routes/userRoutes/userAuth')
const coreApiRouter = require('./routes/coreRoutes/coreApi');
const corePolicyRouter = require('./routes/coreRoutes/corePolicy')
// const coreDownloadRouter = require('./routes/coreRoutes/coreDownloadRouter');
// const corePublicRouter = require('./routes/coreRoutes/corePublicRouter');
const adminAuth = require('./controllers/coreControllers/adminAuth');
const permissionRouter = require('./routes/perRoutes/perApi')
const AttendanceRouter = require('./routes/AttendanceRoutes/attendanceApi')
const LeaveRouter = require('./routes/LeaveRoutes/leaveApi')
const AssetRouter = require('./routes/AssetRoutes/assetApi')

const errorHandlers = require('./handlers/errorHandlers');
const erpApiRouter = require('./routes/appRoutes/appApi');
const isAdminOrOwner = require('./middlewares/access/AdminOwner')

const coreNoticeRouter = require('./routes/coreRoutes/coreNotice')

const runCrons = require('./cron')

const fileUpload = require('express-fileupload');
// create our Express app
const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins, including http and https
      callback(null, origin || '*');
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(compression());

runCrons()

// // default options
// app.use(fileUpload());

// Here our API Routes

app.use('/api', coreAuthRouter);
// app.use('/api/employee',userAuthRouter)
app.use('/api', adminAuth.isValidAuthToken, coreApiRouter);
app.use('/api/permission',adminAuth.isValidAuthToken,isAdminOrOwner,permissionRouter)
app.use('/api', adminAuth.isValidAuthToken, erpApiRouter);
app.use('/api/policy',adminAuth.isValidAuthToken,corePolicyRouter)
app.use('/api/notice',adminAuth.isValidAuthToken,coreNoticeRouter)
app.use('/api/attendance',adminAuth.isValidAuthToken,AttendanceRouter)
app.use('/api/leave',adminAuth.isValidAuthToken,LeaveRouter)
app.use('/api/asset', adminAuth.isValidAuthToken,AssetRouter)


// app.use('/download', coreDownloadRouter);
// app.use('/public', corePublicRouter);

// If that above routes didnt work, we 404 them and forward to error handler
app.use(errorHandlers.notFound);

// production error handler
app.use(errorHandlers.productionErrors);

// done! we export it so we can start the site in start.js
module.exports = app;
