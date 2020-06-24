const calendar = require('../handlers/calendar-handler');
const slack_handler = require('../handlers/slack-handler');

module.exports.checkForEvents = async function () {
    let events;
    try {
        events = (await calendar.getNextEvents(4)).data.items; // change to 4 (2 at each point)
    } catch (error) {
        return Promise.reject(error);
    }
    let results = []
    for (let event of events) {
        try {
            const startTimeDate = new Date(event.start.dateTime);
            const timeDifference = startTimeDate.getTime() - Date.now();

            const isSoon = await isEventSoon(timeDifference);
            const parameters = await parseDescription(event.summary, event.description, this.isTranslationRequired(event.description) ? await slack_handler.generateChannelNameIdMapping() : undefined);

            const message = generateMessage(event, parameters, timeDifference, isSoon, startTimeDate);

            await slack_handler.postMessageToChannel((parameters.alert_type === "alert-main-channel" ? "<!channel>\n" : "") + message, parameters.main_channel);
            
            if (parameters.alert_type === "alert-single-channel") {
                await slack_handler.directMessageSingleChannelGuestsInChannels(message + "\n\n_You have been sent this message because you are a single channel guest who might have otherwise missed this alert._", parameters.additional_channels);
            } else {
                await slack_handler.postMessageToChannels(message, parameters.additional_channels);
            }
        } catch (error) {
            if (error === "no-send") {
                results.push(Promise.resolve("no-send"));// change to resolve
            } else {
                results.push(Promise.reject(error));
            }
        }
    }
    return Promise.all(results);
}

module.exports.parseDescription = async function(summary, description, channelIDMap) {
    if (description === undefined) return Promise.reject("Upcoming *" + summary + "* contains an undefined description");

    //removing whitespace from beginning and ends incase people leave trailing or leading spaces in descriptions
    const lines = description.split("\n");

    if (lines.length < 3) return Promise.reject("Upcoming *" + summary + "* does not contain required parameters");
    
    const parameters = {
        type: "",
        main_channel: "",
        additional_channels: "",
        alert_type: "",
        agenda: "",
        extra: ""
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

    if (lines[3] !== '') {
        if (lines[3] === "default") {
            parameters.additional_channels = slack_handler.defaultChannels;
        } else {
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
    } else if(lines[3] === "default") {
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

    parameters.extra = (lines[5] === undefined ? "" : lines[5]);

    return parameters;
}

module.exports.generateMessage = async function(event, parameters, timeDifference, isEventSoon, startTimeDate) {
    let message = "Reminder: *" + event.summary + "* is occuring ";

    if (isEventSoon) {
        message += "in *" + Math.ceil(timeDifference / 1000 / 60) + " minutes*";
    } else {
        message += "on *" + startTimeDate.toLocaleString("en-US", { timeZone: "America/New_York" }) + "*";
    }

    if (parameters.type === "meeting") {
        message += "\nPlease see the agenda items:" + parameters.agenda;
    } else if (parameters.type === "test") {
        message += "\nToday's test is located at: " + (event.location === undefined ? "<insert funny location here>" : event.location);
    }

    if (parameters.extra != "") {
        message += "\nNotes: " + parameters.extra;
    }

    if (isEventSoon && parameters.type === "meeting") {
        message += "\nWays to attend:\n      :office: In person @ " + event.location + "\n      :globe_with_meridians: Online @ https://meet.jit.si/bay_area\n      :calling: By phone +1-437-538-3987 (2633 1815 39)";
    } else {
        message += "\nReact with :watermelon: if you're coming!";
    }

    if (parameters.alert_type === "alert" || parameters.alert_type === "alert-single-channel") {
        message = "<!channel>\n" + message;
    }

    return message;
}

module.exports.isEventSoon = async function(timeDifference) {
    if (timeDifference < 300000 && timeDifference > 0) {// if the time difference is less than 5 minutes, event is soon
        return Promise.resolve(true);
    } else if (timeDifference > 21600000 - 300000 && timeDifference < 21600000 + 300000) { // if the time difference is somewhere around 5:55 and 6:05 hh:mm away
        return Promise.resolve(false);
    } else { // its not in those two times, so skip
        // but returning reject causes error, so add a flag to know that this is an OK error
        return Promise.reject("no-send");
        //return Promise.resolve(true);
    }
}

module.exports.isTranslationRequired = function(description) {
    const lines = description.split("\n");
    if(lines[2] === "default" || lines[1] === "alert-single-channel") {
        return true;
    } else {
        return false;
    }
}