const slack_handler = require("./slack-handler");

module.exports.process = async function (request) {
    request = JSON.parse(request);
    slack_handler.postMessageToChannel(
        new Date().toISOString() + " " + request.user.name + " submitted " + request.view.callback_id + " for meeting " + request.view.private_metadata,
        "minerva-log",
        false
    );
    if (request.view.callback_id === "meeting_edit") {
        return require("../commands/meeting/edit").recieve(request.view);
    } else {
        return Promise.reject("Command not recognized.");
    }
};
