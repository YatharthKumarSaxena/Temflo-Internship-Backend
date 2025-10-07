const { defaultConfig } = require("./defaultTemplates");

const leaveTemplate = {
    // 🔹 Leave Events
    leaveRequestCreated: {
        ...defaultConfig,
        subject: "Leave Request Submitted",
        event_name: "Leave Request Created",
        action: "Create",
        message_intro: "A leave request has been submitted and is pending review.",
        actionbutton_text: "View Leave Request",
        actionlink: "http://localhost:3000/leave/<Leave_ID>", // controller se replace hoga
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/leave/<Leave_ID>"
    },

    leaveRequestStatusUpdated: {
        ...defaultConfig,
        subject: "Leave Request Status Updated",
        event_name: "Leave Request Status Updated",
        action: "Update",
        message_intro: "The status of a leave request has been updated.",
        actionbutton_text: "View Leave Request",
        actionlink: "http://localhost:3000/leave/<Leave_ID>", // controller se replace hoga
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/leave/<Leave_ID>",
    },

    leaveRequestCreatedByEmployee: {
        ...defaultConfig,
        subject: "Leave Request Submitted",
        event_name: "Leave Request Created by Employee",
        action: "Create",
        message_intro: "You have successfully submitted a leave request.",
        actionbutton_text: "View Leave Request",
        actionlink: "http://localhost:3000/leave/<Leave_ID>", // controller se replace hoga
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/leave/<Leave_ID>",
    },

    leaveRequestDeletedByEmployee: {
        ...defaultConfig,
        subject: "Leave Request Deleted",
        event_name: "Leave Request Deleted by Employee",
        action: "Delete",
        message_intro: "Your leave request has been deleted."
    },

    leaveRequestStatusUpdatedByEmployee: {
        ...defaultConfig,
        subject: "Leave Request Status Updated",
        event_name: "Leave Request Status Updated by Employee",
        action: "Update",
        message_intro: "You have updated the status of your leave request.",
        actionbutton_text: "View Leave Request",
        actionlink: "http://localhost:3000/leave/<Leave_ID>", // controller se replace hoga
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/leave/<Leave_ID>"
    },

    // 🔹 Leave Policy Events
    leavePolicyCreated: {
        ...defaultConfig,
        subject: "New Leave Policy Created",
        event_name: "Leave Policy Created",
        action: "Create",
        message_intro: "A new leave policy has been created for your organization.",
        actionbutton_text: "View Leave Policies",
        actionlink: "http://localhost:3000/leave/policies", // controller se replace hoga
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/leave/policies"
    },

    leavePolicyUpdated: {
        ...defaultConfig,
        subject: "Leave Policy Updated",
        event_name: "Leave Policy Updated",
        action: "Update",
        message_intro: "A leave policy has been updated in your organization.",
        actionbutton_text: "View Leave Policies",
        actionlink: "http://localhost:3000/leave/policies", // controller se replace hoga
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/leave/policies"
    },

    leavePolicyApplied: {
        ...defaultConfig,
        subject: "New Leave Policy Applied",
        event_name: "Leave Policy Applied",
        action: "Apply",
        message_intro: "A new leave policy has been applied to your account.",
        actionbutton_text: "View My Leave Balance",
        actionlink: "http://localhost:3000/leave/balance", // controller se replace hoga
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/leave/balance"
    },

    // 🔹 Leave Balance Events
    leaveBalanceCreated: {
        ...defaultConfig,
        subject: "Leave Balance Created",
        event_name: "Leave Balance Created",
        action: "Create",
        message_intro: "Your leave balance has been created for the new leave policy.",
        actionbutton_text: "View My Leave Balance",
        actionlink: "http://localhost:3000/leave/balance", // controller se replace hoga
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/leave/balance"
    },

    leaveBalanceUpdated: {
        ...defaultConfig,
        subject: "Leave Balance Updated",
        event_name: "Leave Balance Updated",
        action: "Update",
        message_intro: "Your leave balance has been updated.",
        actionbutton_text: "View My Leave Balance",
        actionlink: "http://localhost:3000/leave/balance", // controller se replace hoga
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/leave/balance"
    },

    leaveBalanceReset: {
        ...defaultConfig,
        subject: "Leave Balance Reset",
        event_name: "Leave Balance Reset",
        action: "Reset",
        message_intro: "Your leave balance has been reset by the administration.",
        actionbutton_text: "View My Leave Balance",
        actionlink: "http://localhost:3000/leave/balance", // controller se replace hoga
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/leave/balance"
    },

    // 🔹 WFH Policy Events
    wfhPolicyCreated: {
        ...defaultConfig,
        subject: "New WFH Policy Created",
        event_name: "WFH Policy Created",
        action: "Create",
        message_intro: "A new Work From Home policy has been created for your organization.",
        actionbutton_text: "View WFH Policies",
        actionlink: "http://localhost:3000/wfh/policies", // controller se replace hoga
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/wfh/policies"
    },

    wfhPolicyApplied: {
        ...defaultConfig,
        subject: "WFH Policy Applied",
        event_name: "WFH Policy Applied",
        action: "Apply",
        message_intro: "Work From Home policy has been applied to your account.",
        actionbutton_text: "View WFH Options",
        actionlink: "http://localhost:3000/wfh/options", // controller se replace hoga
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/wfh/options"
    }
}

module.exports = {
    leaveTemplate
}