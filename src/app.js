const express = require('express');

const cors = require('cors');
const compression = require('compression');

const cookieParser = require('cookie-parser');

// Import security middlewares
const {
  applyHelmet,
  generalRateLimit,
  applyMongoSanitize,
  applyXssProtection,
  additionalSecurityHeaders,
  validateRequest,
  secureFileUpload,
  mongoQueryProtection,
} = require('./middlewares/security');

// Import simplified rate limiting
const { simpleRateLimit } = require('./middlewares/rateLimiting');
const securityConfig = require('./config/security.config');

// Import security monitoring
const {
  ipBlockingMiddleware,
  trackFailedAttempts,
  detectSuspiciousActivity,
  monitorSecurityHeaders,
  monitorRateLimiting,
} = require('./middlewares/securityMonitoring');

const coreAuthRouter = require('./routes/coreRoutes/coreAuth');
// const userAuthRouter = require('./routes/userRoutes/userAuth')
const coreApiRouter = require('./routes/coreRoutes/coreApi');
const corePolicyRouter = require('./routes/coreRoutes/corePolicy');
// const coreDownloadRouter = require('./routes/coreRoutes/coreDownloadRouter');
// const corePublicRouter = require('./routes/coreRoutes/corePublicRouter');
const adminAuth = require('./controllers/coreControllers/adminAuth');
const permissionRouter = require('./routes/perRoutes/perApi');
const AttendanceRouter = require('./routes/AttendanceRoutes/attendanceApi');
const LeaveRouter = require('./routes/LeaveRoutes/leaveApi');
const AssetRouter = require('./routes/AssetRoutes/assetApi');
const ExpenseRouter = require('./routes/expenseRoutes/expenseApi');
const errorHandlers = require('./handlers/errorHandlers');
const erpApiRouter = require('./routes/appRoutes/appApi');
const isAdminOrOwner = require('./middlewares/access/AdminOwner');
const taskManagerRouter = require('./routes/taskManagerRoutes/taskManagerApi');
const isOwner = require('./middlewares/access/Owner')
const coreNoticeRouter = require('./routes/coreRoutes/coreNotice');
const coreNotificationRouter = require('./routes/coreRoutes/coreNotification');
const payrollApiRouter = require('./routes/PayrollRoutes/payrollAPI'); // ✅ payroll import
const materialManagementRouter = require('./routes/materialRoutes/index'); // Material Management routes
const assignmentRouter = require('./routes/appRoutes/assignmentRoutes'); // Assignment routes
const customerRouter = require('./routes/SalesRoutes/customerRoutes'); // Sales Management - Customer routes
const salesOrderRouter = require('./routes/SalesRoutes/salesOrderRoutes'); // Sales Management - Sales Order routes
const salesVerificationConfigRouter = require('./routes/SalesRoutes/salesVerificationConfigRoutes'); // Sales Management - Verification config routes
const faMasterRoutes = require('./routes/financeRoutes/faMasterRoutes');
const businessPlanRouter = require('./routes/coreRoutes/businessPlan')
const checkActivePlan = require('./middlewares/access/checkActivePlan')
const runCrons = require('./cron');

const fileUpload = require('express-fileupload');
// create our Express app
const app = express();

// Apply CORS with security configuration FIRST (before other security middlewares)
app.use(cors(securityConfig.cors));

// Apply security middlewares (order is important)
app.use(applyHelmet);
app.use(additionalSecurityHeaders);

// Apply security monitoring right after security headers are set
app.use(monitorSecurityHeaders);

// Apply IP blocking and monitoring
app.use(ipBlockingMiddleware);
app.use(trackFailedAttempts);
app.use(detectSuspiciousActivity);

// Apply rate limiting
app.use(simpleRateLimit);

// Apply MongoDB sanitization and XSS protection
app.use(applyMongoSanitize);
app.use(applyXssProtection);

// Apply request validation
app.use(validateRequest);

// Apply rate limiting monitoring
app.use(monitorRateLimiting);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(compression());

runCrons();

// // default options
// app.use(fileUpload());

// Here our API Routes

// Authentication routes
app.use('/api', coreAuthRouter);
// app.use('/api/employee',userAuthRouter)
// Protected API routes
app.use('/api', adminAuth.isValidAuthToken, coreApiRouter);
app.use('/api/permission', adminAuth.isValidAuthToken, isAdminOrOwner, permissionRouter);
app.use('/api', adminAuth.isValidAuthToken, erpApiRouter);
app.use('/api/policy', adminAuth.isValidAuthToken, corePolicyRouter);
app.use('/api/notice', adminAuth.isValidAuthToken, coreNoticeRouter);
app.use('/api/notifications', adminAuth.isValidAuthToken, coreNotificationRouter);
app.use('/api/material-management', adminAuth.isValidAuthToken, materialManagementRouter); // Material Management routes
app.use('/api/sales-management/customers', adminAuth.isValidAuthToken, customerRouter); // Sales Management - Customer routes
app.use('/api/sales-management/sales-orders', adminAuth.isValidAuthToken, salesOrderRouter); // Sales Management - Sales Order routes
app.use(
  '/api/sales-management/verification-config',
  adminAuth.isValidAuthToken,
  salesVerificationConfigRouter
); // Sales Management - Verification config

app.use('/api/attendance', adminAuth.isValidAuthToken, AttendanceRouter);
app.use('/api/leave', adminAuth.isValidAuthToken, LeaveRouter);
app.use('/api/asset', adminAuth.isValidAuthToken, AssetRouter);
app.use('/api/expenses', adminAuth.isValidAuthToken, ExpenseRouter);
app.use('/api/task-manager', adminAuth.isValidAuthToken, taskManagerRouter);


app.use('/api/payroll', adminAuth.isValidAuthToken, payrollApiRouter); // ✅ payroll route
app.use('/api/assignment', adminAuth.isValidAuthToken, assignmentRouter); // Assignment routes
app.use('/api/finance', adminAuth.isValidAuthToken, faMasterRoutes);
// app.use('/api/subscription', adminAuth.isValidAuthToken, isOwner, businessPlanRouter)
// app.use('/download', coreDownloadRouter);
// app.use('/public', corePublicRouter);

// If that above routes didnt work, we 404 them and forward to error handler
app.use(errorHandlers.notFound);

// production error handler
app.use(errorHandlers.productionErrors);

// done! we export it so we can start the site in start.js
module.exports = app;
