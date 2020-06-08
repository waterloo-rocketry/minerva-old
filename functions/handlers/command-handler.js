const notify_command = require('../commands/notify');

module.exports.process = async function (request) {
    if (request.command === "/notify") {
        return notify_command.send(request.user_id, request.text, request.channel_id);
    } else {
        return Promise.reject("Command not recognized.");
    }
}