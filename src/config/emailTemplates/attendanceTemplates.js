const { defaultConfig } = require("./defaultTemplates");

const attendanceTemplate = {
    // 🔹 Attendance Marking Events
    attendanceMarkedByAdmin: {
        ...defaultConfig,
        subject: "Attendance Marked by Admin",
        event_name: "Attendance Marked by Admin",
        action: "Mark",
        message_intro: "Your attendance has been marked by the administration.",
        actionbutton_text: "View My Attendance",
        actionlink: "http://localhost:3000/attendance/my-attendance",
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/attendance/my-attendance"
    },

    attendanceMarkedByEmployee: {
        ...defaultConfig,
        subject: "Attendance Marked Successfully",
        event_name: "Attendance Marked by Employee",
        action: "Mark",
        message_intro: "Your attendance has been marked successfully.",
        actionbutton_text: "View My Attendance",
        actionlink: "http://localhost:3000/attendance/my-attendance",
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/attendance/my-attendance"
    },

    attendanceUpdatedByEmployee: {
        ...defaultConfig,
        subject: "Attendance Updated",
        event_name: "Attendance Updated by Employee",
        action: "Update",
        message_intro: "Your attendance has been updated successfully.",
        actionbutton_text: "View My Attendance",
        actionlink: "http://localhost:3000/attendance/my-attendance",
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/attendance/my-attendance"
    },

    bulkAttendanceCreated: {
        ...defaultConfig,
        subject: "Attendance Marked via Bulk Upload",
        event_name: "Bulk Attendance Created",
        action: "Create",
        message_intro: "Your attendance has been marked through bulk upload by the administration.",
        actionbutton_text: "View My Attendance",
        actionlink: "http://localhost:3000/attendance/my-attendance",
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/attendance/my-attendance"
    },

    // 🔹 Attendance Request Events
    attendanceRequestCreated: {
        ...defaultConfig,
        subject: "Attendance Request Submitted",
        event_name: "Attendance Request Created",
        action: "Create",
        message_intro: "An attendance request has been submitted and is pending approval.",
        actionbutton_text: "View Request Details",
        actionlink: "http://localhost:3000/attendance/requests",
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/attendance/requests"
    },

    attendanceRequestStatusUpdated: {
        ...defaultConfig,
        subject: "Attendance Request Status Updated",
        event_name: "Attendance Request Status Updated",
        action: "Update",
        message_intro: "The status of your attendance request has been updated.",
        actionbutton_text: "View Request Details",
        actionlink: "http://localhost:3000/attendance/requests",
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/attendance/requests"
    },

    // 🔹 Attendance Policy Events
    attendancePolicyCreated: {
        ...defaultConfig,
        subject: "New Attendance Policy Created",
        event_name: "Attendance Policy Created",
        action: "Create",
        message_intro: "A new attendance policy has been created for your organization.",
        actionbutton_text: "View Attendance Policies",
        actionlink: "http://localhost:3000/attendance/policies",
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/attendance/policies"
    },

    attendancePolicyUpdated: {
        ...defaultConfig,
        subject: "Attendance Policy Updated",
        event_name: "Attendance Policy Updated",
        action: "Update",
        message_intro: "An attendance policy has been updated in your organization.",
        actionbutton_text: "View Attendance Policies",
        actionlink: "http://localhost:3000/attendance/policies",
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/attendance/policies"
    },

    attendancePolicyUpdated: {
        ...defaultConfig,
        subject: "Attendance Policy Updated",
        event_name: "Attendance Policy Updated",
        action: "Update",
        message_intro: "An attendance policy has been updated in your organization.",
        actionbutton_text: "View Attendance Policies",
        actionlink: "http://localhost:3000/attendance/policies",
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/attendance/policies"
    },

    attendancePolicyApplied: {
        ...defaultConfig,
        subject: "New Attendance Policy Applied",
        event_name: "Attendance Policy Applied",
        action: "Apply",
        message_intro: "A new attendance policy has been applied to your account.",
        actionbutton_text: "View My Settings",
        actionlink: "http://localhost:3000/attendance/my-settings",
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/attendance/my-settings"
    },

    // 🔹 Attendance Settings Events
    attendanceSettingsUpdated: {
        ...defaultConfig,
        subject: "Attendance Settings Updated",
        event_name: "Attendance Settings Updated",
        action: "Update",
        message_intro: "Attendance settings for your plant have been updated.",
        actionbutton_text: "View Settings",
        actionlink: "http://localhost:3000/attendance/settings",
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/attendance/settings"
    },

    employeeAttendanceSettingUpdated: {
        ...defaultConfig,
        subject: "Your Attendance Settings Updated",
        event_name: "Employee Attendance Setting Updated",
        action: "Update",
        message_intro: "Your personal attendance settings have been updated by the administration.",
        actionbutton_text: "View My Settings",
        actionlink: "http://localhost:3000/attendance/my-settings",
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/attendance/my-settings"
    },

    // 🔹 Holiday Management Events
    holidayAdded: {
        ...defaultConfig,
        subject: "New Holiday Added",
        event_name: "Holiday Added",
        action: "Create",
        message_intro: "A new holiday has been added to your organization's calendar.",
        actionbutton_text: "View Holiday Calendar",
        actionlink: "http://localhost:3000/attendance/holidays",
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/attendance/holidays"
    },

    holidayDeleted: {
        ...defaultConfig,
        subject: "Holiday Removed",
        event_name: "Holiday Deleted",
        action: "Delete",
        message_intro: "A holiday has been removed from your organization's calendar.",
        actionbutton_text: "View Holiday Calendar",
        actionlink: "http://localhost:3000/attendance/holidays",
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/attendance/holidays"
    },

    // 🔹 Schedule Management Events
    weeklyOffUpdated: {
        ...defaultConfig,
        subject: "Weekly Off Schedule Updated",
        event_name: "Weekly Off Updated",
        action: "Update",
        message_intro: "The weekly off schedule for your plant has been updated.",
        actionbutton_text: "View Schedule",
        actionlink: "http://localhost:3000/attendance/schedule",
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/attendance/schedule"
    },

    workingHoursUpdated: {
        ...defaultConfig,
        subject: "Working Hours Updated",
        event_name: "Working Hours Updated",
        action: "Update",
        message_intro: "The working hours for your plant have been updated.",
        actionbutton_text: "View Schedule",
        actionlink: "http://localhost:3000/attendance/schedule",
        fallback_note: "Having trouble with the button?",
        action_link: "http://localhost:3000/attendance/schedule"
    }
}

module.exports = {
    attendanceTemplate
}
