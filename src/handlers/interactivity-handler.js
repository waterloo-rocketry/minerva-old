const slack_handler = require("./slack-handler");

module.exports.process = async function (payload, metadata) {
    var details = `${new Date().toISOString()} ${payload.user.name} interacted with \`${metadata.type}\`${metadata.subject !== "" ? " for `" + metadata.subject + "`" : ""}`;


    slack_handler.postMessageToChannel(details, "minerva-log", false);
    console.log(details);

    if (payload.type === "view_submission") {
        if (payload.view.callback_id === "meeting_edit") {
            return require("../commands/meeting/edit").receive(payload.view, metadata);
        } else if (payload.view.callback_id === "notify") {
            return require("../commands/notify").receive(payload.view, metadata);
        }
    } else if (payload.type === "block_actions") {
        if (payload.actions[0].action_id === "initialize") {
            return require("../interactivity/initialize").receive(payload.actions[0].value, payload.trigger_id);
        }
    } else {
        return Promise.reject("Interaction not recognized.");
    }
};
