const notify_command = require("../commands/notify");
const meeting_handler = require("../scheduled/events");
const agenda_command = require("../commands/agenda");
const slack_handler = require("./slack-handler");

module.exports.process = async function (request) {
    slack_handler.postMessageToChannel(
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
            request.text,
        "minerva-log",
        false
    );
    if (request.text.startsWith("help")) {
        return Promise.resolve("For help, see: https://github.com/waterloo-rocketry/minerva");
    }
    if (request.command === "/notify") {
        return notify_command.send(request.user_id, request.text, request.channel_id);
    } else if (request.command === "/agenda") {
        return agenda_command.send(request.user_id, request.text, request.channel_name);
    } else {
        return Promise.reject("Command not recognized.");
    }
};
