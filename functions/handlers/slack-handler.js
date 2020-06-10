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

// Given array of channels post the same mes    sage across all channels
module.exports.postMessageToChannels = function (message, channels) {
    var promises = [];
    for (var channel in channels) {
        if (channels[channel] === '') continue; //this is if we remove the initial channel sometimes it gets left in as '', possible to fix this
        promises.push(this.postMessageToChannel(message, channels[channel]));
    }
    return Promise.all(promises);
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

// These are messages that only appear for one person
// https://api.slack.com/methods/chat.postEphemeral
module.exports.postEphemeralMessage = function (user_id, message, channel) {
    return web.chat.postEphemeral({
        channel: channel,
        text: message,
        user: user_id
    });
}

// Someone think of a better name that follows previous convention
module.exports.postMessageToChannelsIfContainsSingle = async function (message, channels) {
    // get all single channel users in the server
    var singleChannelGuests = await slack_handler.getAllSingleChannelGuests();
    // check each channel
    channels.forEach(async (channel) => {
        //if (channel !== '') {
        // get members of the channel
        var members = await slack_handler.getChannelMembers(channel);
        // if there is no overlap between the arrays, do not send
        if (members.members.filter(value => singleChannelGuests.includes(value)).length != 0) {
            // if it is, post the message to the channel
            var messageResponse = await slack_handler.postMessageToChannel(message, channel);
            // for each member in the channel
            members.members.forEach(async (member) => {
                // if they are single channel guest
                if (singleChannelGuests.includes(member)) {
                    // mention them in the thread
                    await slack_handler.postToThread("<@" + member + ">", messageResponse.channel, messageResponse.ts);
                }
            });
        }
        //}
    });
}

// Reminder: user info is returned in the data.user object, not just data
// https://api.slack.com/methods/users.info
module.exports.getUserInfo = function (user_id) {
    return web.users.info({
        user: user_id
    });
}

// Given user_id resolve if admin, reject if not.
module.exports.isAdmin = async function (user_id) {
    const user = await this.getUserInfo(user_id);
    console.log("is admin?: " + JSON.stringify(user));
    if (user.user.is_admin) {
        return Promise.resolve();
    }
    else {
        return Promise.reject("User is not admin");
    }
}

// Requires channel ID not name
// https://api.slack.com/methods/conversations.members
module.exports.getChannelMembers = function (channel) {
    return web.conversations.members({
        channel: channel
    });
}

// Return list of all single channel guests in the entire server
module.exports.getAllSingleChannelGuests = async function () {
    const users = await web.users.list();
    var singleChannel = [];
    users.members.forEach(user => {
        if (user.is_admin) { // CHANGE TO IS_ULTRA_RESTRICICTED ON ACTUAL RELEASE
            singleChannel.push(user.id);
        }
    });
    return Promise.resolve(singleChannel);
}