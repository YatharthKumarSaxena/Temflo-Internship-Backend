const { defaultConfig } = require("./defaultTemplates");

const taskManagerTemplate = {
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
}

module.exports = {
    taskManagerTemplate
}