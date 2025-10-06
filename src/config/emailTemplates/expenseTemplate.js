const { defaultConfig } = require("./defaultTemplates");

const expenseTemplate = {
    // Wallet Events
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
            "WALLET_LINK",
        fallback_note: "Have trouble with the button?",
        action_link:
            "WALLET_LINK"
    },

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

    // Expense Events 
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
        actionlink: "<EXPENSE_LINK>", // controller se replace hoga
        fallback_note: "Having trouble with the button?",
        action_link: "<EXPENSE_LINK>",
    }
}

module.exports = {
    expenseTemplate
}