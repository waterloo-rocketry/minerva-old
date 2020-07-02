const calendar = require("../handlers/calendar-handler");
const slack_handler = require("../handlers/slack-handler");
const moment = require("moment-timezone");

const LOWER_BOUND = 300000; // 5 minutes in milliseconds
const UPPER_BOUND = 21600000; // 6 hours in milliseconds

module.exports.checkForEvents = async function () {
    let events;
    try {
        // select 4 events since it's realistically the maximum number of events that could happen at the same time (2 at either the close or far time point)
        // we could increase this, but in order to keep CPU compute & internet transfer down (since this function runs often)
        // we cap this at 4 events
        events = (await calendar.getNextEvents(4)).data.items;
    } catch (error) {
        return Promise.reject(error);
    }
    let results = [];
    for (let event of events) {
        try {
            const startTimeDate = new Date(event.start.dateTime);
            const timeDifference = startTimeDate.getTime() - Date.now();

            const isEventSoon = await this.isEventSoon(timeDifference);

            // We only want to generate the mapping if we need to translate from channel names --> channel IDs to reduce API calls
            // So, if translation is required, generate, if not, return undefined
            const channelIDMap = this.isTranslationRequired(event.description) ? await slack_handler.generateChannelNameIdMapping() : undefined;
            const parameters = await this.parseDescription(event.summary, event.description, channelIDMap);

            const message = await this.generateMessage(event, parameters, timeDifference, isEventSoon, startTimeDate);

            await slack_handler.postMessageToChannel((parameters.alert_type === "alert-main-channel" ? "<!channel>\n" : "") + message, parameters.main_channel, true);

            if (parameters.alert_type === "alert-single-channel") {
                await slack_handler.directMessageSingleChannelGuestsInChannels(
                    message + "\n\n_You have been sent this message because you are a single channel guest who might have otherwise missed this alert._",
                    parameters.additional_channels
                );
            } else {
                await slack_handler.postMessageToChannels(message, parameters.additional_channels, true);
            }
        } catch (error) {
            if (error === "no-send") {
                results.push(Promise.resolve("no-send"));
            } else {
                results.push(Promise.reject(error));
            }
        }
    }
    return Promise.all(results);
};

module.exports.parseDescription = async function (summary, description, channelIDMap) {
    if (description === undefined) return Promise.reject("Upcoming *" + summary + "* contains an undefined description");

    const lines = description.split("\n");

    if (lines.length < 3) return Promise.reject("Upcoming *" + summary + "* does not contain required parameters");

    const parameters = {
        type: "",
        main_channel: "",
        additional_channels: "",
        alert_type: "",
        agenda: "",
        extra: "",
    };

    switch (lines[0].trim()) {
        case "meeting":
            break;
        case "test":
            break;
        case "other":
            break;
        case "none":
            return Promise.reject("no-send");
        default:
            return Promise.reject("Upcoming *" + summary + "* contains a malformed first-line");
    }
    parameters.type = lines[0].trim();

    switch (lines[1].trim()) {
        case "alert":
            break;
        case "alert-single-channel":
            break;
        case "alert-main-channel":
            break;
        case "copy":
            break;
        default:
            return Promise.reject("Upcoming *" + summary + "* contains a malformed second-line");
    }
    parameters.alert_type = lines[1].trim();

    parameters.main_channel = lines[2].trim().replace("#", "");
    parameters.additional_channels = [];

    if (lines[3] !== undefined && lines[3] !== "") {
        if (lines[3] === "default") {
            parameters.additional_channels = slack_handler.defaultChannels;
        } else {
            lines[3] = lines[3].replace(/\s/g, " ");
            lines[3] = lines[3].replace(/xA0/g, " ");
            parameters.additional_channels = lines[3].replace(/#/g, "").split(" ");
        }
    }

    // We only want to generate the name mapping if we need it
    if (parameters.alert_type === "alert-single-channel") {
        parameters.main_channel = channelIDMap.get(parameters.main_channel);
        for (var index in parameters.additional_channels) {
            if (channelIDMap.has(parameters.additional_channels[index])) {
                parameters.additional_channels[index] = channelIDMap.get(parameters.additional_channels[index]);
            }
        }
    } else if (lines[3] === "default") {
        parameters.main_channel = channelIDMap.get(parameters.main_channel);
    }

    // Get rid of the main_channel if it is within additional channels
    parameters.additional_channels = parameters.additional_channels.filter(value => value != parameters.main_channel);

    if (lines[4] === undefined || lines[4] === "") {
        parameters.agenda = "";
    } else {
        var agendaArray = lines[4].split(",");
        for (var i = 0; i < agendaArray.length; i++) {
            parameters.agenda += "\n    • " + agendaArray[i].trim();
        }
    }

    if (lines[5] !== undefined) {
        parameters.extra = lines[5];
    }

    return parameters;
};

module.exports.generateMessage = async function (event, parameters, timeDifference, isEventSoon, startTimeDate) {
    let message = "Reminder: *" + event.summary + "* is occurring ";

    if (isEventSoon) {
        message += "in *" + Math.ceil(timeDifference / 1000 / 60) + " minutes*";
    } else {
        message += "on *" + moment(startTimeDate).tz("America/Toronto").format("MMMM Do, YYYY [at] h:mm A") + "*";
    }

    if (parameters.type === "meeting") {
        if (parameters.agenda.length === 0 || parameters.agenda[0] === "") {
            message += "\nThere are currently no agenda items listed for this meeting.";
        } else {
            message += "\nPlease see the agenda items:" + parameters.agenda;
        }
    } else if (parameters.type === "test") {
        message += "\nToday's test is located at: " + (event.location === undefined ? "<insert funny location here>" : event.location);
    }

    if (parameters.extra != "") {
        message += "\nNotes: " + parameters.extra;
    }

    if (isEventSoon && parameters.type === "meeting") {
        // prettier-ignore
        message +=
			"\nWays to attend:" +
			"\n      :office: In person @ " + event.location +
			"\n      :globe_with_meridians: Online @ https://meet.jit.si/bay_area" +
			"\n      :calling: By phone +1-437-538-3987 (2633 1815 39)";
    } else {
        message += "\nReact with " + (await slack_handler.getRandomEmoji()) + " if you're coming!";
    }

    if (parameters.alert_type === "alert" || parameters.alert_type === "alert-single-channel") {
        message = "<!channel>\n" + message;
    }

    return message;
};

module.exports.isEventSoon = async function (timeDifference) {
    if (timeDifference < LOWER_BOUND && timeDifference > 0) {
        // if the time difference is less than 5 minutes, event is soon
        return Promise.resolve(true);
    } else if (timeDifference > UPPER_BOUND - LOWER_BOUND && timeDifference < UPPER_BOUND + LOWER_BOUND) {
        // if the time difference is somewhere around 5:55 and 6:05 hh:mm away
        return Promise.resolve(false);
    } else {
        // it's not in those two times, so skip
        // but returning reject causes error, so add a flag to know that this is an OK error
        return Promise.reject("no-send");
    }
};

module.exports.isTranslationRequired = function (description) {
    const lines = description.split("\n");
    return lines[2] === "default" || lines[1] === "alert-single-channel";
};
