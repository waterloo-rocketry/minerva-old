const slack_handler = require('../handlers/slack-handler');

module.exports.send = async function (user_id, textParams, initialChannel) {
    // check if parameters are valid
    var parameterStatus = validateParameters(textParams);
    if (parameterStatus !== undefined) {
        return Promise.reject(parameterStatus);
    }

    // get parameters
    var parameters = filterParameters(textParams, initialChannel);

    // just so we stop people from accidentally @channel'ing every channel
    if (parameters.alert && parameters.channels.length > 5) {
        return Promise.reject("Sorry, you cannot use `alert` when selecting more than 5 channels.");
    }

    try {
        await slack_handler.isAdmin(user_id);
        if (parameters.alert) {
            // copy to all channels with an @channel
            await slack_handler.postMessageToChannels("<!channel> " + parameters.link, parameters.channels);
        } else if (parameters.alert_single_channel) {
            // when we alert single channel guests we do not want to copy the message to every channel -- only the ones with single channel guests

            // get all single channel users in the server
            var singleChannelGuests = await slack_handler.getAllSingleChannelGuests();
            // check each channel
            parameters.channels.forEach(async (channel) => {
                if (channel !== '') {
                    // get members of the channel
                    var members = await slack_handler.getChannelMembers(channel);
                    // if there is no overlap between the arrays, do not send
                    if (members.members.filter(value => singleChannelGuests.includes(value)).length != 0) {
                        // if it is, post the message to the channel
                        var messageResponse = await slack_handler.postMessageToChannel(parameters.link, channel);
                        // for each member in the channel
                        members.members.forEach(async (member) => {
                            // if they are single channel guest
                            if (singleChannelGuests.includes(member)) {
                                // mention them in the thread
                                await slack_handler.postMessageToThread("<@" + member + ">", messageResponse.channel, messageResponse.ts);
                            }
                        });
                    }
                }
            });
        } else {
            // default is to just copy to all channels.
            await slack_handler.postMessageToChannels(parameters.link, parameters.channels);
        }
        return Promise.resolve();
    } catch (error) {
        return Promise.reject(error);
    }
}

function validateParameters(textParams) {
    //module.exports.validate = function(textParams) {
    // check if there are any parameters given
    if (textParams === '') {
        return "Missing required parameter: Link to text";
    }

    // check if first param is a link to a message
    if (!textParams.startsWith("<https://waterloorocketry.slack.com/")) {
        return "Parameter 0 must be a link to a waterloo rocketry message";
    }

    return undefined;
}

function filterParameters(textParams, initialChannel) {
    var params = textParams.split(" ");
    var alert = false;
    var alert_single_channel = false;

    var channels = [];

    // since the parameters are optional we do not know the order, just loop through them all
    for (var index in params) {
        if (params[index].startsWith("<#")) {
            channels.push(params[index].substring(2, 13));
            continue;
        }
        switch (params[index]) {
            case "alert":
                alert = true;
                break;
            case "alert-single-channel":
                alert_single_channel = true;
                break;
            default:
                break;
        }
    }

    // if no channels are selected, send to all default.
    if (channels.length == 0) {
        channels = ["C014J93U4JZ", "C014KSDM37V", "C014RRJG8JG"];
    }

    // get rid of the inital channel, since we don't want to send the message again.
    channels[channels.indexOf(initialChannel)] = '';

    return {
        link: params[0],
        alert: alert,
        alert_single_channel: alert_single_channel,
        channels: channels
    }
}
