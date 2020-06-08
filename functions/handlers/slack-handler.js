const { WebClient } = require('@slack/web-api');
const functions = require('firebase-functions');

const web = new WebClient(functions.config().slack.token);


// https://api.slack.com/methods/chat.postMessage
module.exports.postMessageToChannel = function (message, channel) {
    return web.chat.postMessage({
        text: message,
        channel: channel,
    });
}

// https://api.slack.com/methods/chat.postMessage
// same as above, just with a thread_ts option
module.exports.postMessageToThread = function (message, channel, thread_ts) {
    return web.chat.postMessage({
        text: message,
        channel: channel,
        thread_ts: thread_ts
    });
}

// Reminder: user info is returned in the data.user object, not just data
// https://api.slack.com/methods/users.info
module.exports.getUserInfo = function (user_id) {
    return web.users.info({
        user: user_id
    });
}

module.exports.isAdmin = async function(user_id) {
    const user = await this.getUserInfo(user_id);
    if (user.user.is_admin) {
        return Promise.resolve();
    }
    else {
        return Promise.reject("User is not admin");
    }
}

module.exports.postMessageToChannels = function (message, channels) {
    var promises = [];
    for (var channel in channels) {
        if(channels[channel] === '') continue; //this is if we remove the channel
        promises.push(web.chat.postMessage({
            text: message,
            channel: channels[channel],
        }));
    }
    return Promise.all(promises);
}

// https://api.slack.com/methods/chat.postEphemeral
module.exports.postEphemeralMessage = function(user_id, message, channel) {
    return web.chat.postEphemeral({
        channel: channel,
        text: message,
        user: user_id
    });
}

// https://api.slack.com/methods/conversations.members
module.exports.getChannelMembers = function(channel) {
    return web.conversations.members({
        channel: channel
    });
}

module.exports.getAllSingleChannelGuests = async function() {
    const users = await web.users.list();
    var singleChannel = [];
    users.members.forEach(user => {
        if (user.is_admin) { // CHANGE TO IS_RESTRICICTED ON FULL
            singleChannel.push(user.id);
        }
    });
    return Promise.resolve(singleChannel);
}
