const {WebClient} = require("@slack/web-api");

const web = new WebClient(process.env.slack_token);
const channelNameIdMapping = new Map();

// https://api.slack.com/methods/chat.postMessage
module.exports.postMessageToChannel = function (message, channel, unfurl = trues) {
    return web.chat.postMessage({
        text: message,
        channel: channel,
        unfurl_links: unfurl,
    });
};

// Given array of channels post the same message across all channels
module.exports.postMessageToChannels = function (message, channels, unfurl = true) {
    const promises = [];
    for (var channel of channels) {
        if (channel === "") continue; //this is if we remove the initial channel sometimes it gets left in as '', possible to fix this
        promises.push(this.postMessageToChannel(message, channel, unfurl));
    }
    return Promise.all(promises);
};

// same as above, just with a thread_ts option
// https://api.slack.com/methods/chat.postMessage
module.exports.postMessageToThread = function (message, channel, threadTs) {
    return web.chat.postMessage({
        text: message,
        channel: channel,
        thread_ts: threadTs,
    });
};

// These are messages that only appear for one person
// https://api.slack.com/methods/chat.postEphemeral
module.exports.postEphemeralMessage = function (message, channel, userId) {
    return web.chat.postEphemeral({
        channel: channel,
        text: message,
        user: userId,
    });
};

// https://api.slack.com/methods/chat.postMessage
module.exports.postInteractiveMessage = function (blocks, channel) {
    return web.chat.postMessage({
        blocks: blocks,
        channel: channel,
    });
};

// basically just an alias
// https://api.slack.com/methods/chat.postMessage
module.exports.directMessageUser = function (message, userId, unfurl) {
    return this.postMessageToChannel(message, userId, unfurl);
};

// Someone think of a better name that follows previous convention
// Returns a single promise with the message promises wrapped inside.
module.exports.directMessageSingleChannelGuestsInChannels = async function (message, channels) {
    try {
        const memberPromises = [];
        const messagePromises = [];
        // get all single channel users in the server
        const singleChannelGuests = await this.getAllSingleChannelGuests();
        // check each channel
        for (const channel of channels) {
            // get members of the channel
            memberPromises.push(await this.getChannelMembers(channel));
        }

        await Promise.all(memberPromises);

        for (members of memberPromises) {
            members = members.members;

            const singleChannelMembersInChannel = members.filter(member => singleChannelGuests.includes(member));
            // if there is any overlap, iterate through and message them
            for (const member of singleChannelMembersInChannel) {
                messagePromises.push(await this.directMessageUser(message, member, true));
            }
        }

        return Promise.all(messagePromises);
    } catch (error) {
        return Promise.reject(error);
    }
};

// https://api.slack.com/methods/reactions.add
module.exports.addReactionToMessage = function (channel, emoji, timestamp) {
    return web.reactions.add({
        channel: channel,
        name: emoji,
        timestamp: timestamp,
    });
};

// Reminder: user info is returned in the data.user object, not just data
// https://api.slack.com/methods/users.info
module.exports.getUserInfo = function (userId) {
    return web.users.info({
        user: userId,
    });
};

// Given user_id resolve if admin, reject if not.
module.exports.isAdmin = async function (user_id) {
    const user = await this.getUserInfo(user_id);
    if (user.user.is_admin) {
        return Promise.resolve();
    } else {
        return Promise.reject("User is not admin");
    }
};

// Requires channel ID not name
// https://api.slack.com/methods/conversations.members
module.exports.getChannelMembers = function (channel) {
    return web.conversations.members({
        channel: channel,
    });
};

// Return list of all single channel guests in the entire server
module.exports.getAllSingleChannelGuests = async function () {
    const users = await web.users.list();
    var singleChannel = [];
    users.members.forEach(user => {
        // is_admin is used in development since is_ultra_restricted does not work without a paid plan
        // if (user.is_admin) {
        if (user.is_ultra_restricted) {
            singleChannel.push(user.id);
        }
    });
    return Promise.resolve(singleChannel);
};

// Map channel names to ID's for functions that require IDs, not names
module.exports.generateChannelNameIdMapping = async function () {
    if (channelNameIdMapping.length > 0) {
        return channelNameIdMapping;
    } else {
        var channels = (await this.getChannels("public_channel", true)).channels;
        channels.forEach(channel => {
            channelNameIdMapping.set(channel.name, channel.id);
        });
        return channelNameIdMapping;
    }
};

// https://api.slack.com/methods/conversations.list
module.exports.getChannels = function (types, excludeArchived) {
    return web.conversations.list({
        types: types,
        exclude_archived: excludeArchived,
        limit: 900,
    });
};

// A hardcoded list of default channel ID's.
// This will differ from the development & production slack
// software, recovery, propulsion, payload, general, electrical, airframe, liquid_engine, business, mechanical
module.exports.defaultChannels = ["C01535M46SC", "C8VL7QCG0", "CCWGTJH7F", "C4H4NJG77", "C07MWEYPR", "C07MX0QDS", "C90E34QDD", "CV7S1E49Y", "C07MXA613", "C07MX5JDB"]; // production workspace
//module.exports.defaultChannels = ["C0155MGT7NW", "C015BSR32E8", "C014J93U4JZ", "C0155TL4KKM", "C0155MHAHB4", "C014QV0F9AB", "C014YVDDLTG"]; // development workspace

// https://api.slack.com/methods/emoji.list
module.exports.getRandomEmoji = async function () {
    const emojiArray = [];
    // Unfortunately the result is a JSON object, convert it to an array for convenience
    for (const emoji in (await web.emoji.list()).emoji) {
        emojiArray.push(emoji);
    }

    // This will never return the final object in the list since the domain of Math.random is [0, 1)
    // There is likely a better sol'n. But this works
    return emojiArray[Math.floor(Math.random() * emojiArray.length)];
};

// https://api.slack.com/methods/view.open
module.exports.openView = async function (triggerId, view) {
    return web.views.open({
        trigger_id: triggerId,
        view: view,
    });
};

// https://api.slack.com/methods/view.update
module.exports.updateView = async function (viewId, view) {
    return web.views.update({
        view_id: viewId,
        view: view,
    });
};
