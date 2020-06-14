const slack_handler = require('../handlers/slack-handler');

module.exports.send = async function (user_id, textParams, initialChannel) {
    // check if parameters are valid
    try {
        // will go to error on reject
        var parameters = await filterParameters(textParams, initialChannel);

        await slack_handler.isAdmin(user_id);

        var message = (parameters.alert_type === "alert" ? "<!channel>\n" : "") + parameters.link;

        if (parameters.alert_type === "alert-single-channel") {
            // when we alert single channel guests we simply want to PM them the message
            await slack_handler.directMessageSingleChannelGuestsInChannels(message + "\n\n_You have been sent this message because you are a single channel guest who might have otherwise missed this alert._", parameters.channels);
        } else {
            // default is to just copy to all channels with message (that can contain alert or not)
            await slack_handler.postMessageToChannels(message, parameters.channels);
        }
        return Promise.resolve();
    } catch (error) {
        return Promise.reject(error);
    }
}

async function filterParameters(textParams, initialChannel) {
    if (textParams === '') {
        return Promise.reject("Missing required parameter: Link to text");
    }

    // check if first param is a link to a message
    if (!textParams.startsWith("<https://waterloorocketry.slack.com/")) {
        return Promise.reject("Parameter 0 must be a link to a waterloo rocketry message");
    }

    var parameters = {
        link: "",
        alert_type: "",
        channels: []
    };
    var initialParams = textParams.split(" ");

    parameters.link = initialParams[0];

    // since the parameters are optional we do not know the order, just loop through them all
    for (var index = 1; index < initialParams.length; index++) {
        var param = initialParams[index];
        if (param.startsWith("<#")) {
            parameters.channels.push(param.substring(2, 13));
            continue;
        } else {
            switch (param) {
                case "alert":
                    break;
                case "alert-single-channel":
                    break;
                default:
                    return Promise.reject("Unknown parameter: " + param);
            }
            parameters.alert_type = param;
        }
    }

    // if no channels are selected, send to all default.
    if (parameters.channels.length === 0) {
        parameters.channels = slack_handler.defaultChannels;
    }

     // just so we stop people from accidentally @channel'ing every channel
     if (parameters.alert_type === "alert" && parameters.channels.length > 6) {
        return Promise.reject("Sorry, you cannot use `alert` when selecting more than 5 channels.");
    }

    // get rid of the inital channel, since we don't want to send the message again.
    parameters.channels = parameters.channels.filter(value => value != initialChannel);

    return parameters;
}
