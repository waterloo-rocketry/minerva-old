const slack_handler = require('../handlers/slack-handler');

module.exports.send = async function (user_id, textParams, initialChannel) {
    // check if parameters are valid
    try {
        // will go to error on reject
        const parameters = await this.filterParameters(textParams, initialChannel);

        await slack_handler.isAdmin(user_id);

        const message = (parameters.alert_type === "alert" ? "<!channel>\n" : "") + parameters.link;

        if (parameters.alert_type === "alert-single-channel") {
            // when we alert single channel guests we simply want to PM them the message
            await slack_handler.directMessageSingleChannelGuestsInChannels(message + "\n\n_You have been sent this message because you are a single channel guest who might have otherwise missed this alert._", parameters.channels);
        } else {
            // otherwise, just copy the message to the channels. It may have an 'alert' appended to it.
            await slack_handler.postMessageToChannels(message, parameters.channels);
        }
        return Promise.resolve();
    } catch (error) {
        return Promise.reject(error);
    }
}

module.exports.filterParameters = async function (textParams, initialChannel) {
    if (textParams === '') {
        return Promise.reject("Incorrect usage: /notify <link-to-message> <copy/alert/alert-single-channel> [#channel1, #channel2, ...]");
    }

    // check if first param is a link to a message
    if (!textParams.startsWith("<https://waterloorocketry.slack.com/")) {
        return Promise.reject("Parameter 1 must be a link to a waterloo rocketry message");
    }

    const parameters = {
        link: "",
        alert_type: "",
        channels: []
    };
    const unfilteredParams = textParams.split(" ");

    parameters.link = unfilteredParams[0].replace("<", "").replace(">", "");

    switch (unfilteredParams[1]) {
        case "copy":
            break;
        case "alert":
            break;
        case "alert-single-channel":
            break;
        default:
            return Promise.reject("Parameter 2 must be either `copy/alert/alert-single-channel`");
    }
    parameters.alert_type = unfilteredParams[1];

    // loop through remaining parameters, which must be channels
    for (var index = 2; index < unfilteredParams.length; index++) {
        const channel = unfilteredParams[index];
        if (channel.startsWith("<#")) {
            parameters.channels.push(channel.substring(2, 13));
            continue;
        }
    }

    // if no channels are selected, send to all default.
    if (parameters.channels.length === 0) {
        parameters.channels = slack_handler.defaultChannels;
    }

    // just so we stop people from accidentally @channel'ing every channel
    if (parameters.alert_type === "alert" && parameters.channels.length > 5) {
        return Promise.reject("Sorry, you cannot use `alert` when selecting more than 5 channels.");
    }

    // get rid of the inital channel, since we don't want to double-message the initial channel (if it happens to be in the selection)
    parameters.channels = parameters.channels.filter(value => value != initialChannel);

    return parameters;
}
