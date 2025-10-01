const { defaultConfig } = require("./defaultTemplates");

const employeeTemplate = {
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

    accountStatusChange: {
        ...defaultConfig,
        subject: "Your Account Status is changed by Administrator",
        event_name: "Account Status Changed",
        status: "Activated",
        action: "Inform",
        message_intro: "",
        notes: ""
    },

    employeeAssigned: {
        ...defaultConfig,
        subject: "Inform about Employee Assignment",
        event_name: "Employee Assigned",
        action: "Inform",
        message_intro: "You have been assigned as Supervisor by the Admin for the following Employee",
        notes: "",
        actionbutton_text: "View Employee",
        actionlink: "http://localhost:3000/reset-password/<token>", // controller se inject hoga
        fallback_note: "If the button doesn’t work, copy and paste the link below into your browser:",
        action_link: "http://localhost:3000/reset-password/<token>" // controller se inject hoga
    },
}

module.exports = {
    employeeTemplate
}