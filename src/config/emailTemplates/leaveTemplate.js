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
    }
}

module.exports = {
    leaveTemplate
}