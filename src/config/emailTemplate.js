// templates/masterTemplate.js

const defaultConfig = {
    user_name: "Temflo System Private Company",
    company_name: "ERPICA",
    currentyear: new Date().getFullYear(),
    notes: "",
    action_cta: "",
    actionbutton_text: "",
    actionlink: "",
    details: {},
    fallback_note: "",
    action_link: "",
    status: "",
};

const masterTemplate = {
    // 🔹 Verification Events
    verification: {
        ...defaultConfig,
        subject: "Verify Your ERPICA Account",
        event_name: "Account Verification",
        action: "Email Confirmation",
        message_intro:
            "Thank you for creating your ERPICA account. To complete your registration and secure your account, please verify your email address by clicking the button below.",
        actionbutton_text: "Verify Email Address",
        actionlink:
            "http://localhost:3000/verify/68a6bcb585d5927d093daf33e/Aasw20JopPY3bi",
        fallback_note: "Have trouble with the button?",
        action_link:
            "http://localhost:3000/verify/68a6bcb585d5927d093daf33e/Aasw20JopPY3bi",
    },

resetPassword: {
    ...defaultConfig,
    subject: "Reset Your ERPICA Password",
    event_name: "Password Reset",
    action: "Reset",
    message_intro:
        "We received a request to reset your ERPICA account password. Click the button below to set a new password.",
    actionbutton_text: "Reset Password",
    actionlink: "http://localhost:3000/reset-password/<token>", // controller se inject hoga
    fallback_note: "If the button doesn’t work, copy and paste the link below into your browser:",
    action_link: "http://localhost:3000/reset-password/<token>" // controller se inject hoga
},
    // 🔹 Wallet Events
    walletDebit: {
        ...defaultConfig,
        subject: "ERPICA Wallet Debited Successfully",
        event_name: "Wallet Transaction",
        action: "Debit",
        status: "Success",
        message_intro:
            "This is to inform you that your ERPICA wallet has been debited successfully. Please find the transaction details below.",
        actionbutton_text: "View Transaction",
        actionlink:
            "http://localhost:3000/wallet/transactions/TXN-ERPICA-0925-001",
        fallback_note: "Have trouble with the button?",
        action_link:
            "http://localhost:3000/wallet/transactions/TXN-ERPICA-0925-001"
    },

// Wallet Events - updated
walletDebited: {
    ...defaultConfig,
    subject: "Wallet Debited",
    event_name: "Wallet Debited",
    action: "Update",
    status: "Success",
    message_intro: "Your wallet has been debited successfully.",
    actionbutton_text: "View Wallet",
    actionlink: "<WALLET_LINK>", // controller se inject hoga
    fallback_note: "Having trouble with the button?",
    action_link: "<WALLET_LINK>"
},

walletRefunded: {
    ...defaultConfig,
    subject: "Wallet Refunded",
    event_name: "Wallet Refunded",
    action: "Update",
    status: "Success",
    message_intro: "Your wallet has been refunded.",
    actionbutton_text: "View Wallet",
    actionlink: "<WALLET_LINK>", // controller se inject hoga
    fallback_note: "Having trouble with the button?",
    action_link: "<WALLET_LINK>"
},


    walletBalanceAdded: {
        ...defaultConfig,
        subject: "Wallet Balance Added",
        event_name: "Wallet Balance Added",
        action: "Update",
        message_intro: "Funds have been added to your wallet.",
        actionbutton_text: "View Wallet Balance",
        actionlink: "", // controller se inject hoga
        fallback_note: "Having trouble with the button?",
        action_link: "", // controller se inject hoga
    },

walletStatusUpdated: {
    ...defaultConfig,
    subject: "Wallet Status Updated",
    event_name: "Wallet Status Updated",
    action: "Update",
    message_intro: "Your wallet status has been updated by the administrator.",
    details: {
        Status: "<NEW_STATUS>",
        Date: new Date().toLocaleString()
    },
    actionbutton_text: "View Wallet Status",
    actionlink: "<STATUS_LINK>",
    fallback_note: "Having trouble with the button?",
    action_link: "<STATUS_LINK>"
},


walletTransactionCreated: {
    ...defaultConfig,
    subject: "New Wallet Transaction",
    event_name: "Wallet Transaction Created",
    action: "Create",
    message_intro: "A new wallet transaction has been recorded.",
    actionbutton_text: "View Transaction",
    actionlink: "<TRANSACTION_LINK>", // controller se inject hoga
    fallback_note: "Having trouble with the button?",
    action_link: "<TRANSACTION_LINK>"
},


walletRequestCreated: {
    ...defaultConfig,
    subject: "Wallet Request Submitted",
    event_name: "Wallet Request Created",
    action: "Create",
    message_intro: "Your wallet request has been submitted and is pending approval.",
    details: {
        Amount: "<AMOUNT>",       // injected by controller
        Date: new Date().toLocaleString(),
        RequestID: "<REQUEST_ID>"
    },
    actionbutton_text: "View Wallet Request",
    actionlink: "<REQUEST_LINK>",  // injected by controller
    fallback_note: "Having trouble with the button?",
    action_link: "<REQUEST_LINK>"
},
walletRequestApproved: {
    ...defaultConfig,
    subject: "Wallet Request Approved",
    event_name: "Wallet Request Approved",
    action: "Update",
    status: "Approved",
    message_intro: "Your wallet request has been approved.",
    details: {
        Amount: "<AMOUNT>",
        Date: new Date().toLocaleString(),
        RequestID: "<REQUEST_ID>"
    },
    actionbutton_text: "View Approved Request",
    actionlink: "<APPROVED_REQUEST_LINK>",
    fallback_note: "Having trouble with the button?",
    action_link: "<APPROVED_REQUEST_LINK>"
},
walletRequestRejected: {
    ...defaultConfig,
    subject: "Wallet Request Rejected",
    event_name: "Wallet Request Rejected",
    action: "Update",
    status: "Rejected",
    message_intro: "Your wallet request has been rejected.",
    details: {
        Amount: "<AMOUNT>",
        Date: new Date().toLocaleString(),
        RequestID: "<REQUEST_ID>",
        Reason: "<REJECTION_REASON>"
    },
    actionbutton_text: "View Rejected Request",
    actionlink: "<REJECTED_REQUEST_LINK>",
    fallback_note: "Having trouble with the button?",
    action_link: "<REJECTED_REQUEST_LINK>"
},

/*
    // 🔹 Admin-Level Events
    businessAreaCreate: {
        ...defaultConfig,
        subject: "New Business Area Created",
        event_name: "Business Area Create",
        action: "Create",
        message_intro: "A new business area has been successfully created in the ERPICA system.",
    },

    businessAreaRemove: {
        ...defaultConfig,
        subject: "Business Area Removed",
        event_name: "Business Area Removed",
        action: "Remove",
        message_intro: "A business area has been removed from the ERPICA system.",
    },

    businessAreaUpdate: {
        ...defaultConfig,
        subject: "Business Area Updated",
        event_name: "Business Area Updated",
        action: "Update",
        message_intro: "Details of a business area have been updated.",
    },

    departmentCreate: {
        ...defaultConfig,
        subject: "New Department Created",
        event_name: "Department Created",
        action: "Create",
        message_intro: "A new department has been successfully created.",
    },

    departmentRemove: {
        ...defaultConfig,
        subject: "Department Removed",
        event_name: "Department Removed",
        action: "Remove",
        message_intro: "A department has been removed from the system.",
    },

    departmentUpdate: {
        ...defaultConfig,
        subject: "Department Updated",
        event_name: "Department Updated",
        action: "Update",
        message_intro: "Department details have been updated.",
    },

    gstinCreate: {
        ...defaultConfig,
        subject: "GSTIN Number Created",
        event_name: "GSTIN Number Created",
        action: "Create",
        message_intro: "A new GSTIN number has been added to the company profile.",
    },

    gstinRemove: {
        ...defaultConfig,
        subject: "GSTIN Number Removed",
        event_name: "GSTIN Number Removed",
        action: "Remove",
        message_intro: "A GSTIN number has been removed from the company profile.",
    },

    gstinUpdate: {
        ...defaultConfig,
        subject: "GSTIN Number Updated",
        event_name: "GSTIN Number Updated",
        action: "Update",
        message_intro: "GSTIN details have been updated.",
    }, */

    companyDetailsUpdated: {
        ...defaultConfig,
        subject: "Company Details Updated",
        event_name: "Company Details Updated",
        action: "Update",
        message_intro: "Company profile details have been updated by the administrator.",
    },

    // 🔹 Employee / User Events
    employeeCreation: {
        ...defaultConfig,
        subject: "You’ve Been Registered on ERPICA",
        event_name: "Employee Creation",
        action: "Account Created",
        message_intro:
            "Your company has registered you on ERPICA. Please verify your account to get started.",
        action_cta: "Click below to verify your account and activate access.",
        actionbutton_text: "Verify Account",
        actionlink: "http://localhost:3000/verify/employee/abc123",
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/verify/employee/abc123",
    },

    userPasswordChanged: {
        ...defaultConfig,
        subject: "Your ERPICA Password Was Changed",
        event_name: "User Password Changed",
        action: "Inform",
        message_intro: "Your password has been successfully updated. If this wasn’t you, please contact support immediately.",
        notes: "Contact your Admin for password."
    },

    // 🔹 Asset Events
    assetTransferApproved: {
        ...defaultConfig,
        subject: "Asset Transfer Approved",
        event_name: "Asset Transfer Approved",
        action: "Update (Approve)",
        status: "Approved",
        message_intro: "Your asset transfer request has been approved by the administrator.",
        notes:
            "Asset ID: AST-0925-001\nTransferred From: John Doe\nTransferred To: Yatharth Kumar Saxena\nDate: 05 September 2025",
    },

    assetTransferRejected: {
        ...defaultConfig,
        subject: "Asset Transfer Rejected",
        event_name: "Asset Transfer Rejected",
        action: "Update (Reject)",
        status: "Rejected",
        message_intro: "Your asset transfer request has been rejected by the administrator.",
    },

    assetTransferRequested: {
        ...defaultConfig,
        subject: "New Asset Transfer Request Submitted",
        event_name: "Asset Transfer Requested",
        action: "Create (New Transfer Request)",
        message_intro: "An asset transfer request has been submitted and is pending approval."
    },

    assetAssigned: {
        ...defaultConfig,
        subject: "New Asset Assigned to You",
        event_name: "Asset Assigned",
        action: "Assign",
        message_intro: "An asset has been successfully assigned to you. Please find the details below."
    },

// Expense Events - updated
expenseClaimCreated: {
    ...defaultConfig,
    subject: "New Expense Claim Submitted",
    event_name: "Expense Claim Created",
    action: "Create",
    message_intro: "An expense claim has been submitted and is pending review.",
    actionbutton_text: "View Expense",
    actionlink: "<EXPENSE_LINK>", // controller se inject hoga
    fallback_note: "Having trouble with the button?",
    action_link: "<EXPENSE_LINK>"
},
expenseUpdated: {
    ...defaultConfig,
    subject: "Expense Updated",
    event_name: "Expense Updated",
    action: "Update",
    message_intro: "Your expense claim has been updated.",
    actionbutton_text: "View Expense",
    actionlink: "<EXPENSE_LINK>", // controller se inject hoga
    fallback_note: "Having trouble with the button?",
    action_link: "<EXPENSE_LINK>"
},

expenseFileUploaded: {
    ...defaultConfig,
    subject: "File Uploaded to Expense",
    event_name: "File Uploaded",
    action: "Create",
    message_intro: "A file has been uploaded to your expense claim.",
    actionbutton_text: "View Files",
    actionlink: "<EXPENSE_LINK>", // controller se inject hoga
    fallback_note: "Having trouble with the button?",
    action_link: "<EXPENSE_LINK>"
},

expenseCommentAdded: {
    ...defaultConfig,
    subject: "New Comment on Expense",
    event_name: "Comment Added on Expense",
    action: "Create",
    message_intro: "A new comment has been added to your expense claim.",
    actionbutton_text: "View Expense",
    actionlink: "http://localhost:3000/expense/<EXPENSE_ID>", // controller se replace hoga
    action_link: "http://localhost:3000/expense/<EXPENSE_ID>",
},

    // 🔹 Leave Events
    leaveRequestCreated: {
        ...defaultConfig,
        subject: "Leave Request Submitted",
        event_name: "Leave Request Created",
        action: "Create",
        message_intro: "A leave request has been submitted and is pending review.",
    },

    leaveRequestStatusUpdated: {
        ...defaultConfig,
        subject: "Leave Request Status Updated",
        event_name: "Leave Request Status Updated",
        action: "Update",
        message_intro: "The status of a leave request has been updated.",
    },

    leaveRequestCreatedByEmployee: {
        ...defaultConfig,
        subject: "Leave Request Submitted",
        event_name: "Leave Request Created by Employee",
        action: "Create",
        message_intro: "You have successfully submitted a leave request.",
    },

    leaveRequestDeletedByEmployee: {
        ...defaultConfig,
        subject: "Leave Request Deleted",
        event_name: "Leave Request Deleted by Employee",
        action: "Delete",
        message_intro: "Your leave request has been deleted.",
    },

    leaveRequestStatusUpdatedByEmployee: {
        ...defaultConfig,
        subject: "Leave Request Status Updated",
        event_name: "Leave Request Status Updated by Employee",
        action: "Update",
        message_intro: "You have updated the status of your leave request.",
    },
    // Task related events
    taskCommentAdded: {
        ...defaultConfig,
        subject: "New Comment Added to Task",
        event_name: "Task Comment Added",
        action: "Create",
        message_intro: "A new comment has been added to your task.",
            actionbutton_text: "View Task",
    actionlink: "<TASK_LINK>", // controller se inject hoga
    fallback_note: "Having trouble with the button?",
    action_link: "<TASK_LINK>"
    },

    taskAssignedToEmployee: {
        ...defaultConfig,
        subject: "Task Assigned",
        event_name: "Task Assigned to Employee",
        action: "Create",
        message_intro: "You have been assigned a new task.",
            actionbutton_text: "View Task",
    actionlink: "<TASK_LINK>", // controller se inject hoga
    fallback_note: "Having trouble with the button?",
    action_link: "<TASK_LINK>"
    },

    taskUnassignedFromEmployee: {
        ...defaultConfig,
        subject: "Task Unassigned",
        event_name: "Task Unassigned from Employee",
        action: "Delete",
        message_intro: "A task has been unassigned from you.",
    },

    // Project related events
    employeeAssignedToProject: {
        ...defaultConfig,
        subject: "Employee Assigned to Project",
        event_name: "Employee Assigned to Project",
        action: "Create",
        message_intro: "You have been assigned to a new project.",
            actionbutton_text: "View Project",
    actionlink: "<PROJECT_LINK>", // controller se inject hoga
    fallback_note: "Having trouble with the button?",
    action_link: "<PROJECT_LINK>"
    },

    employeeRemovedFromProject: {
        ...defaultConfig,
        subject: "Employee Removed from Project",
        event_name: "Employee Removed from Project",
        action: "Delete",
        message_intro: "You have been removed from a project.",
    },
    // 🔹 Task/Subtask Related Events - Missing Templates
subtaskAssignedToEmployee: {
    ...defaultConfig,
    subject: "Subtask Assigned",
    event_name: "Subtask Assigned to Employee",
    action: "Create",
    message_intro: "You have been assigned a new subtask.",
    actionbutton_text: "View Subtask",
    actionlink: "<SUBTASK_LINK>", // controller se inject hoga
    fallback_note: "Having trouble with the button?",
    action_link: "<SUBTASK_LINK>"
},

subtaskRemovedFromEmployee: {
    ...defaultConfig,
    subject: "Subtask Unassigned",
    event_name: "Subtask Unassigned from Employee",
    action: "Delete",
    message_intro: "A subtask has been unassigned from you."
},

subtaskCommentAdded: {
    ...defaultConfig,
    subject: "New Comment Added to Subtask",
    event_name: "Subtask Comment Added",
    action: "Create",
    message_intro: "A new comment has been added to your subtask.",
    actionbutton_text: "View Subtask",
    actionlink: "<SUBTASK_LINK>", // controller se inject hoga
    fallback_note: "Having trouble with the button?",
    action_link: "<SUBTASK_LINK>"
}
};

module.exports = { masterTemplate };
