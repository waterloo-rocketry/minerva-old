const slack_handler = require("./slack-handler");

module.exports.process = async function (payload, metadata) {
    slack_handler.postMessageToChannel(
        new Date().toISOString() +
            " " +
            payload.user.name +
            " interacted with `" +
            metadata.type +
            "`" +
            (metadata.subject != "" ? "for `" + metadata.subject + "`" : ""), // If the interaction has a subject, say the subject. Otherwise, do not.
        "minerva-log",
        false
    );
    if (payload.type === "view_submission") {
        if (payload.view.callback_id === "meeting_edit") {
            return require("../commands/meeting/edit").recieve(payload.view, metadata);
        } else if (payload.view.callback_id === "notify") {
            return require("../commands/notify").recieve(payload.view, metadata);
        }
    } else if (payload.type === "block_actions") {
        if (payload.actions[0].action_id === "initialize") {
            return require("../interactivity/initialize").recieve(payload.actions[0].value, payload.trigger_id);
        }
    } else {
        return Promise.reject("Interaction not recognized.");
    }
};
