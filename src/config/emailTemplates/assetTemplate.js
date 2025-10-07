const { defaultConfig } = require("./defaultTemplates");

const assetTemplate = {
    // 🔹 Asset Events
    assetTransferApproved: {
        ...defaultConfig,
        subject: "Asset Transfer Approved",
        event_name: "Asset Transfer Approved",
        action: "Update (Approve)",
        status: "Approved",
        message_intro: "Your asset transfer request has been approved by the administrator.",
        actionbutton_text: "View Transfer",
        actionlink: "<EXPENSE_LINK>", // controller se inject hoga
        fallback_note: "Having trouble with the button?",
        action_link: "<EXPENSE_LINK>"
    },

    assetTransferRejected: {
        ...defaultConfig,
        subject: "Asset Transfer Rejected",
        event_name: "Asset Transfer Rejected",
        action: "Update (Reject)",
        status: "Rejected",
        message_intro: "Your asset transfer request has been rejected by the administrator.",
        actionbutton_text: "View Transfer",
        actionlink: "<EXPENSE_LINK>", // controller se inject hoga
        fallback_note: "Having trouble with the button?",
        action_link: "<EXPENSE_LINK>"
    },

    assetTransferRequested: {
        ...defaultConfig,
        subject: "New Asset Transfer Request Submitted",
        event_name: "Asset Transfer Requested",
        action: "Create (New Transfer Request)",
        message_intro: "An asset transfer request has been submitted and is pending approval.",
        actionbutton_text: "View Transfer",
        actionlink: "<EXPENSE_LINK>", // controller se inject hoga
        fallback_note: "Having trouble with the button?",
        action_link: "<EXPENSE_LINK>"
    },

    assetAssigned: {
        ...defaultConfig,
        subject: "New Asset Assigned to You",
        event_name: "Asset Assigned",
        action: "Assign",
        message_intro: "An asset has been successfully assigned to you by Admin. Please find the details below.",
        actionbutton_text: "View Asset",
        actionlink: "<EXPENSE_LINK>", // controller se inject hoga
        fallback_note: "Having trouble with the button?",
        action_link: "<EXPENSE_LINK>"
    },
    assetUpdate: {
        ...defaultConfig,
        subject: "Asset Assignment Update",
        event_name: "Asset Assignment Changed",
        action: "Assignment Notification",
        message_intro: "This asset is assigned to you by the Admin.", // Will be set dynamically: "You have been assigned/unassigned an asset"
        actionbutton_text: "View Asset",
        actionlink: "", // Will be set dynamically: link to asset details
        fallback_note: "If the button doesn't work, copy the link below:",
        action_link: "", // Will be set dynamically same as actionlink
        details: {}, // Will be populated dynamically with asset info
    },
    assetUnassigned: {
        ...defaultConfig,
        subject: "Asset Unassigned from You",
        event_name: "Asset Unassigned",
        action: "Unassign",
        message_intro: "An asset has been unassigned from you by Admin. Please find the details below.",
        actionbutton_text: "View Asset",
        actionlink: "", // Controller se dynamically set hoga
        fallback_note: "If the button doesn't work, copy the link below:",
        action_link: "", // Same as actionlink
        details: {}, // Asset info dynamically populate hoga
    },
    assetExpiryTemplate: {
        ...defaultConfig,
        subject: "Asset Expiry Notification",
        event_name: "Asset Expiry",
        action: "Notify",
        message_intro: "<ASSET_NAME> assigned to you is expiring <EXPIRY_TYPE> on <EXPIRY_DATE>.", // Controller se dynamic replace hoga
        actionbutton_text: "View Asset",
        actionlink: "<ASSET_LINK>", // Controller/job se dynamically set hoga
        fallback_note: "If the button doesn't work, copy the link below:",
        action_link: "<ASSET_LINK>", // Same as actionlink
        details: {} // Controller/job me dynamically populate hoga
    },
    assetStatusChange: {
        ...defaultConfig,
        subject: "Asset Status Update",
        event_name: "Asset Status Changed",
        action: "Notify",
        message_intro: "Your asset status has been assigned changed by the Admin.",
        actionbutton_text: "View Asset",
        actionlink: "<ASSET_LINK>",
        fallback_note: "If the button doesn't work, copy the link below:",
        action_link: "<ASSET_LINK>",
        details: {}
    },
    assetCreated: {
        ...defaultConfig,
        subject: "New Asset Created",
        event_name: "Asset Created",
        action: "Create",
        message_intro: "A new asset has been successfully created by you in the system.",
        actionbutton_text: "View Asset",
        actionlink: "<ASSET_LINK>", // Controller se inject hoga
        fallback_note: "If the button doesn't work, copy the link below:",
        action_link: "<ASSET_LINK>", // Same as actionlink
        details: {} // Controller se dynamically populate hoga
    },

    // 🔹 Responsible Templates
    assetResponsibleAssigned: {
        ...defaultConfig,
        subject: "You are now Responsible for an Asset",
        event_name: "Asset Responsibility Assigned",
        action: "Responsibility Assigned",
        message_intro: "You have been designated as responsible for the following asset.",
        actionbutton_text: "View Asset",
        actionlink: "<ASSET_LINK>",
        fallback_note: "Having trouble with the button?",
        action_link: "<ASSET_LINK>"
    },

    assetResponsibleUnassigned: {
        ...defaultConfig,
        subject: "You are no longer Responsible for an Asset",
        event_name: "Asset Responsibility Unassigned",
        action: "Responsibility Removed",
        message_intro: "You have been unassigned from responsible designation for the following asset.",
        actionbutton_text: "View Asset",
        actionlink: "<ASSET_LINK>",
        fallback_note: "Having trouble with the button?",
        action_link: "<ASSET_LINK>"
    },

    assetInformResponsible: {
        ...defaultConfig,
        subject: "Asset Transfer Notification",
        event_name: "Asset Transfer Notification",
        action: "Notify Responsibility",
        message_intro: "The following asset has been transferred. Please find the details below.",
        actionbutton_text: "View Asset",
        actionlink: "<ASSET_LINK>",
        fallback_note: "Having trouble with the button?",
        action_link: "<ASSET_LINK>"
    }
}

module.exports = {
    assetTemplate
}