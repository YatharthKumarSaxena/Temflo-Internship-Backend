const { defaultConfig } = require("./defaultTemplates");

const appTemplate = {
    plantCreation: {
        ...defaultConfig,
        subject: "New Plant Creation",
        event_name: "New Plant Created",
        action: "Create",
        message_intro: "A new plant has been created in your company.",
        actionbutton_text: "View Plant",
        actionlink: "<PLANT_LINK>", // controller se inject hoga
        fallback_note: "Having trouble with the button?",
        action_link: "<PLANT_LINK>"
    }
}

module.exports = {
    appTemplate
}