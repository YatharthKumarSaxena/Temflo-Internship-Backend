module.exports = {
  MODULE: Object.freeze({
    app: 'appControllers',
    attendance: 'attendanceController',
    core: 'coreControllers',
    middlewares: 'middlewareControllers',
    user: 'userControllers',
    asset: 'assetControllers',
    leave: 'LeaveController',
    notification: 'notificationController',
    notice: 'noticeController',
    policy: 'policyController',
    taskManager: 'TaskManagerController',
    expense: 'ExpenseController',
    permission: 'perController',
    payroll: 'payrollController',
    material: 'MaterialControllers',
    sales: 'SalesControllers',
    purchase: 'PurchaseControllers',
  }),

  SUBMODULE: Object.freeze({
    // app
    business: 'businessAreaController',
    department: 'departmentController',
    gstinNumber: 'gstinNumberController',
    plant: 'plantController',
    business_segment: 'businessSegmentController',
    cost_profit_center: 'costProfitController',

    // core
    profile: 'profileController',
    setting: 'settingController',
    user: 'userController',

    // middlewares
    createAuth: 'createAuthMiddleware',
    createCRUD: 'createCRUDController',
    createUser: 'createUserController',

    // Task Manager
    activity: 'activityControllers',
    member: 'memberControllers',
    project: 'projectControllers',
    task: 'taskControllers',
    workspace: 'workspaceControllers',
    employeeSubtask: 'employeeSubtaskControllers',
    employeeTask: 'employeeTaskControllers',
    subtask: 'subtaskControllers'
  }),

  FILE: Object.freeze({
    // app
    file_business_create: 'create',
    file_business_remove: 'remove',
    file_business_update: 'update',

    file_department_create: 'create',
    file_department_remove: 'remove',
    file_department_update: 'update',

    file_gstinNumber_create: 'create',
    file_gstinNumber_remove: 'remove',
    file_gstinNumber_update: 'update',

    // Material
    file_generalLedger: 'generalLedgerController',
    file_hsn: 'hsnController',
    file_material: 'materialController',
    file_purchaseOrderBooking: 'purchaseOrderBookingController',
    file_purchaseOrder: 'purchaseOrderController',
    file_supplier: 'supplierController',
    file_supplierVerification: 'supplierVerificationController',
    file_verificationConfig: 'verificationConfigController',

    file_plant_create: 'create',
    file_plant_remove: 'remove',
    file_plant_update: 'update',

    file_businessSegment_create: 'create',
    file_businessSegment_remove: 'remove',
    file_businessSegment_update: 'update',

    file_costProfitCenter_create: 'create',
    file_costProfitCenter_remove: 'remove',
    file_costProfitCenter_update: 'update',

    file_assignment: "assignmentController",

    // attendance
    file_attendance_attendanceSetting: 'AttendanceSetting',
    file_project_attachment_uploaded: 'uploadAttachment',
    file_project_attachment_deleted: 'deleteAttachment',
    file_task_attachment_uploaded: 'uploadAttachment',
    file_task_attachment_deleted: 'deleteAttachment',
    file_subtask_attachment_uploaded: 'uploadAttachment',
    file_subtask_attachment_deleted: 'deleteAttachment',
    file_subtask_create: 'createSubtask',
    file_subtask_delete: 'remove',
    file_subtask_update: 'update',
    file_permission_added: 'feature',

    // middlewares
    file_createAuth_login: 'login',
    file_createAuth_logout: 'logout',
    file_createAuth_resetPassword: 'resetPassword',
    file_createAuth_verifyEmail: 'verifyEmail',
    file_createAuth_register: 'signup',
    file_createAuth_authUser: 'file_auth_user',

    file_createCRUD_create: 'create',
    file_createCRUD_remove: 'remove',
    file_createCRUD_update: 'update',

    file_createUser_updatePassword: 'updatePassword',
    file_createUser_updateProfile: 'updateProfile',
    file_createUser_updateProfilePassword: 'updateProfilePassword',

    // Sales
    file_customer: 'CustomerController',
    file_salesOrder: 'SalesOrderController',
    file_salesVerification: 'SalesVerificationConfigController',

    // Purchase
    file_supplier: 'SupplierController',

    // core
    file_profile_deleteInfo: 'deleteInfo',
    file_profile_update: 'update',

    file_setting_updateCompanyDetails: 'updateCompanyDetails',
    file_setting_updatePassword: 'updatePassword',

    // user
    file_user_createBulk: 'createBulk',
    file_user_createUser: 'createUser',
    file_user_deleteInfo: 'deleteInfo',
    file_user_remove: 'remove',
    file_user_update: 'update',

    // Permission
    file_permission_create: 'create',
    file_permission_remove: 'remove',
    file_permission_update: 'update',

    // Notice
    file_notice_remove: 'remove',
    file_notice_update: 'update',

    // Policy
    file_policy_remove: 'remove',
    file_policy_update: 'update',

    // Asset
    file_admin_asset: 'adminAssetController',
    file_employee_asset: 'employeeAssetController',

    // Employee Subtask
    file_employee_subtask_update: 'update',

    // attendance
    file_attendance_setting: 'AttendanceSetting',
    file_employee_attendance_setting: 'EmployeeAtendanceSetting',
    file_employee_mark_attendance: 'EmployeeMarkAttendance',
    file_mark_attendance_bulk: 'markAttendanceBulk',

    //  Expense
    file_wallet: 'walletController',
    file_admin_expense: 'adminExpenseController',

    // Leave
    file_employee_leave: 'employeeLeaveController',
    file_admin_leave: 'adminLeaveController',

    // Task
    file_create_activity: 'createActivity',
    file_create_member: 'createMember',
    file_remove_member: 'remove',
    file_create_project: 'createProject',
    file_remove_project: 'remove',
    file_update_project: 'update',
    file_create_workspace: 'createWorkspace',
    file_remove_workspace: 'remove',
    file_update_workspace: 'update',
    file_create_task: 'createTask',
    file_remove_task: 'remove',
    file_update_task: 'update',
    file_index: 'index',
    file_employee_task_update: 'update',

    // Payroll
    file_allowance: 'Allowance',
    file_batch: 'Batch',
    file_compensation: 'Compensation',
    file_deduction: 'Deduction',
    file_directDeposit: 'DirectDeposit',
    file_form: 'Form',
    file_loan: 'Loan',
    file_loanRepayment: 'LoanRepayment',
    file_payPeriod: 'PayPeriod',
    file_payslip: 'Payslip',
    file_payslipSettings: 'PayslipSettings',
    file_roundingAmount: 'RoundingAmount',
    file_salaryTemplate: 'SalaryTemplate',
    file_salaryTemplateDeduction: 'SalaryTemplateDeduction',
    file_settlement: 'Settlement',
    file_taxRule: 'TaxRule',
    file_user: 'User',
    file_UserWithBatch: 'UserWithBatch',
    file_TDSConfig: 'TDSConfig',
    file_YTDImport: 'YTDImport'

  }),

  MODEL_AFFECTED: Object.freeze({
    // app
    model_business: 'Business Area',
    model_businessSegment: 'Business Segment',
    model_costProfitCenter: 'Cost Profit Center',
    model_departmentAssignment: 'DepartmentAssignment',
    model_client: 'Client',
    model_company: 'Company',
    model_department: 'Department',
    model_employee: 'Employee',
    model_expense: 'Expense',
    model_expenseCategory: 'ExpensePolicy',
    model_gstinNumber: 'GstinNumber',
    model_invoice: 'Invoice',
    model_customer: 'Customer',
    model_lead: 'Lead',
    model_offer: 'Offer',
    model_order: 'Order',
    model_payment: 'Payment',
    model_paymentMode: 'PaymentMode',
    model_people: 'People',
    model_plant: 'Plant',
    model_product: 'Product',
    model_productCategory: 'ProductCategory',
    model_purchase: 'Purchase',
    model_quote: 'Quote',
    model_salesOrder: 'SalesOrder',
    model_shipment: 'Shipment',
    model_taxes: 'Taxes',
    model_notification: 'Notification',

    // Material
    model_GeneralLedger: 'GeneralLedger',
    model_Hsn: 'Hsn',
    model_Material: 'Material',
    model_PurchaseOrderBooking: 'PurchaseOrderBooking',
    model_PurchaseOrder: 'PurchaseOrder',
    model_Supplier: 'Supplier',
    model_VerificationConfig: 'VerificationConfig',

    // attendance
    model_attendance: 'Attendance',
    model_attendanceRequest: 'AttendanceRequest',
    model_attendanceSetting: 'AttendanceSetting',

    // core
    model_admin: 'Admin',
    model_adminPassword: 'AdminPassword',
    model_email: 'Email',
    model_notice: 'Notice',
    model_policy: 'Policy',
    model_setting: 'Setting',
    model_upload: 'Upload',

    // role
    model_role: 'Role',

    // user
    model_permission: 'Permission',
    model_user: 'User',
    model_userPassword: 'UserPassword',

    // task manager
    model_project: 'Project',
    model_activity: 'Activity',
    model_task: 'Task',
    model_subtask: 'Subtask',
    model_workspace: 'Workspace',
    model_member: 'Member',
    model_leave: 'LeavePolicy',
    model_balance: 'LeaveBalance',
    model_leaveRequest: 'LeaveRequest',
    model_wallet: 'WalletTransaction',
    model_assetType: 'AssetType',
    model_asset: 'Asset',
    model_assetTransfer: 'AssetTransfer',
    model_attendancePolicy: ' AttendancePolicy',
    model_employeeAttendanceSetting: 'EmployeeAttendanceSetting',
    model_allowance: 'Allowance',
    model_batch: 'Batch',
    model_compensation: 'Compensation',
    model_deduction: 'Deduction',
    model_directDeposit: 'DirectDeposit',
    model_form: 'Form',
    model_loan: 'Loan',
    model_loanRepayment: 'LoanRepayment',
    model_payPeriod: 'PayPeriod',
    model_payslip: 'Payslip',
    model_payslipSettings: 'PayslipSettings',
    model_roundingSetting: 'RoundingSetting',
    model_salaryTemplate: 'SalaryTemplate',
    model_salaryTemplateDeduction: 'SalaryTemplateDeduction',
    model_settlement: 'Settlement',
    model_taxRule: 'TaxRule',
    model_TDSConfig: 'TDSConfig',
    model_YTDImport: 'YTDImport',
    model_UserWithBatch: 'model_UserWithBatch'
  }),

  ACTIONS: Object.freeze({
    create: 'CREATE',
    update: 'UPDATE',
    delete: 'DELETE',
  }),
};