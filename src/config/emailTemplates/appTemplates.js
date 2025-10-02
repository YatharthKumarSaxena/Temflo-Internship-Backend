const { defaultConfig } = require("./defaultTemplates");

const appTemplate = {
    plantCreation: {
        ...defaultConfig,
        subject: "New Plant Creation",
        event_name: "New Plant Created",
        action: "Create",
        message_intro: "A new plant has been created in your company."
    }
}

module.exports = {
    appTemplate
}