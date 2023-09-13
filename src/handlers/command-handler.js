const slack_handler = require("./slack-handler");

module.exports.process = async function (request) {
    var details =
        new Date().toISOString() +
        ": <#" +
        request.channel_id +
        "|" +
        request.channel_name +
        "> " +
        request.user_name +
        " executed " +
        request.command +
        " " +
        request.text;

    slack_handler.postMessageToChannel(details, "minerva-log", false);

    console.log(details);

    if (request.text.startsWith("help")) {
        return Promise.resolve("For help, see: https://github.com/waterloo-rocketry/minerva");
    }
    if (request.command === "/notify") {
        return require("../commands/notify").send(request.user_id, request.trigger_id, request.channel_id);
    } else if (request.command === "/agenda") {
        slack_handler.postEphemeralMessage("This command has been removed. Please see: /meeting");
    } else if (request.command === "/meeting") {
        return require("../commands/meeting").send(request.user_id, request.text, request.channel_id, request.channel_name, request.trigger_id);
    } else if (request.command === "/initialize") {
        return require("../commands/initialize").send();
    } else {
        return Promise.reject("Command not recognized.");
    }
};
