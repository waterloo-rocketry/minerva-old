const slack_handler = require("./slack-handler");

module.exports.process = async function (payload) {
    slack_handler.postMessageToChannel(
        new Date().toISOString() + " " + payload.user.name + " submitted " + payload.view.callback_id + " for meeting " + payload.view.private_metadata.summary,
        "minerva-log",
        false
    );
    if (payload.view.callback_id === "meeting_edit" && payload.type === "view_submission") {
        return require("../commands/meeting/edit").recieve(payload.view);
    } else {
        return Promise.reject("Interaction not recognized.");
    }
};
