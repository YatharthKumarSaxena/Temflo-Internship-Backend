module.exports = {
  MODULE: Object.freeze({
    app: 'appControllers',
    attendance: 'attendanceController',
    core: 'coreControllers',
    middlewares: 'middlewareControllers',
    user: 'userControllers',
  }),

  SUBMODULE: Object.freeze({
    // app
    business: 'businessAreaController',
    department: 'departmentController',
    gstinNumber: 'gstinNumberController',
    plant: 'plantController',

    // attendance
    attendanceSetting: 'AttendanceSetting',

    // core
    profile: 'profileController',
    setting: 'settingController',
    user: 'userController',

    // middlewares
    createAuth: 'createAuthMiddleware',
    createCRUD: 'createCRUDController',
    createUser: 'createUserController',
  }),

  FILE: Object.freeze({
    // app
    file_business_create: 'create.js',
    file_business_remove: 'remove.js',
    file_business_update: 'update.js',

    file_department_create: 'create.js',
    file_department_remove: 'remove.js',
    file_department_update: 'update.js',

    file_gstinNumber_create: 'create.js',
    file_gstinNumber_remove: 'remove.js',
    file_gstinNumber_update: 'update.js',

    file_plant_create: 'create.js',
    file_plant_remove: 'remove.js',
    file_plant_update: 'update.js',

    // attendance
    file_attendance_attendanceSetting: 'AttendanceSetting.js',

    // middlewares
    file_createAuth_login: 'login.js',
    file_createAuth_logout: 'logout.js',
    file_createAuth_resetPassword: 'resetPassword.js',
    file_createAuth_verifyEmail: 'verifyEmail.js',
    file_createAuth_register: 'signup.js',
    file_createAuth_authUser: 'file_auth_user',

    file_createCRUD_create: 'create.js',
    file_createCRUD_remove: 'remove.js',
    file_createCRUD_update: 'update.js',

    file_createUser_updatePassword: 'updatePassword.js',
    file_createUser_updateProfile: 'updateProfile.js',
    file_createUser_updateProfilePassword: 'updateProfilePassword.js',

    // core
    file_profile_deleteInfo: 'deleteInfo.js',
    file_profile_update: 'update.js',

    file_setting_updateCompanyDetails: 'updateCompanyDetails.js',
    file_setting_updatePassword: 'updatePassword.js',

    // user
    file_user_createBulk: 'createBulk.js',
    file_user_createUser: 'createUser.js',
    file_user_deleteInfo: 'deleteInfo.js',
    file_user_remove: 'remove.js',
    file_user_update: 'update.js',
  }),

  MODEL_AFFECTED: Object.freeze({
    // app
    model_business: 'businessArea',
    model_client: 'Client',
    model_company: 'Company',
    model_department: 'Department',
    model_employee: 'Employee',
    model_expense: 'Expense',
    model_expenseCategory: 'ExpenseCategory',
    model_gstinNumber: 'GstinNumber',
    model_invoice: 'Invoice',
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
    model_shipment: 'Shipment',
    model_taxes: 'Taxes',

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
  }),

  ACTIONS: Object.freeze({
    create: 'CREATE',
    update: 'UPDATE',
    delete: 'DELETE',
  }),
};
