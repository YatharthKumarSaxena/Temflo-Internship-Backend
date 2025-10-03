const { defaultConfig } = require("./defaultTemplates");

const appTemplate = {
    plantCreation: {
        ...defaultConfig,
        subject: "New Plant Creation",
        event_name: "New Plant Created",
        action: "Create",
        message_intro: "A new plant has been created in your company.",
        notes: ""
    },
    plantUpdation: {
        ...defaultConfig,
        subject: "Plant Updated",
        event_name: "Plant Updated",
        action: "Update",
        message_intro: "A plant has been updated in your company.",
        notes: ""
    }
}

module.exports = {
    appTemplate
}