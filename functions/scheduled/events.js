var calendar = require('../handlers/calendar-handler');
var slack_handler = require('../handlers/slack-handler');

module.exports.checkForEvents = async function () {
    var events;
    try {
        events = (await calendar.getNextEvents(4)).data.items; // change to 4 (2 at each point)
    } catch (error) {
        return Promise.reject(error);
    }
    var results = []
    for (var index in events) {
        try {
            var event = events[index];

            var currentTimeMillis = new Date().getTime();
            var startTimeDate = new Date(event.start.dateTime);
            var timeDifference = startTimeDate.getTime() - currentTimeMillis;

            var isSoon = await isEventSoon(timeDifference);
            var parameters = await parseDescription(event);

            var message = generateMessage(event, parameters, timeDifference, isSoon, startTimeDate);

            await slack_handler.postMessageToChannel((parameters.alert_type === "alert-main-channel" ? "<!channel>\n" : "") + message, parameters.main_channel);

            console.log(parameters);
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

async function parseDescription(event) {
    var description = event.description;
    if (description === undefined) return Promise.reject("Upcoming *" + event.summary + "* contains an undefined description");

    var lines = description.split("\n");

    if (lines.length < 3) return Promise.reject("Upcoming *" + event.summary + "* does not contain required parameters");

    var parameters = {
        type: "",
        main_channel: "",
        additional_channels: "",
        alert_type: "",
        agenda: "",
        extra: ""
    };

    switch (lines[0]) {
        case "general":
            break;
        case "subteam":
            break;
        case "test":
            break;
        case "other":
            break;
        default:
            return Promise.reject("Upcoming *" + event.summary + "* contains a malformed first-line");
    }
    parameters.type = lines[0];

    switch (lines[1]) {
        case "alert":
            break;
        case "alert-single-channel":
            break;
        case "alert-main-channel":
            break;
        case "copy":
            break;
        case "no-reminder":
            return Promise.reject("no-send");
        default:
            return Promise.reject("Upcoming *" + event.summary + "* contains a malformed second-line");
    }
    parameters.alert_type = lines[1];

    parameters.main_channel = lines[2].replace("#", "");
    parameters.additional_channels = [];

    if (lines[3] !== '') {
        if (lines[3] === "default") {
            parameters.additional_channels = slack_handler.defaultChannels;
        } else {
            parameters.additional_channels = lines[3].replace(/#/g, "").split(" ");
        }
    }

    // We only want to generate the name mapping if we need it
    // It's only needed if we have alert-single-channel
    if (parameters.alert_type === "alert-single-channel") {
        var channelIDMap = await slack_handler.generateChannelNameIdMapping();
        parameters.main_channel = channelIDMap.get(parameters.main_channel);
        for (var index in parameters.additional_channels) {
            if (channelIDMap.has(parameters.additional_channels[index])) {
                parameters.additional_channels[index] = channelIDMap.get(parameters.additional_channels[index]);
            }
        }
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

function generateMessage(event, parameters, timeDifference, isEventSoon, startTimeDate) {
    var message = "Reminder: *" + event.summary + "* is occuring ";

    if (isEventSoon) {
        message += "in *" + Math.ceil(timeDifference / 1000 / 60) + " minutes*";
    } else {
        message += "on *" + startTimeDate.toLocaleString("en-US", { timeZone: "America/New_York" }) + "*";
    }

    if (parameters.type === "general" || parameters.type === "subteam") {
        message += "\nPlease see the agenda items:" + parameters.agenda;
    } else if (parameters.type === "test") {
        message += "\nToday's test is located at: " + (event.location === undefined ? "<insert funny location here>" : event.location);
    }

    if (parameters.extra != "") {
        message += "\nNotes: " + parameters.extra;
    }

    if (isEventSoon && (parameters.type === "general" || parameters.type === "subteam")) {
        message += "\nWays to attend:\n      :office: In person @ " + event.location + "\n      :globe_with_meridians: Online @ https://meet.jit.si/bay_area\n      :calling: By phone +1-437-538-3987 (2633 1815 39)";
    } else {
        message += "\nReact with :watermelon: if you're coming!";
    }

    if (parameters.alert_type === "alert" || parameters.alert_type === "alert-single-channel") {
        message = "<!channel>\n" + message;
    }

    return message;
}

async function isEventSoon(timeDifference) {
    if (timeDifference < 300000 && timeDifference > 0) {// if the time difference is less than 5 minutes, event is soon
        return Promise.resolve(true);
    } else if (timeDifference > 21600000 - 300000 && timeDifference < 21600000 + 300000) { // if the time difference is somewhere around 6 hours away
        return Promise.resolve(false);
    } else { // its not in those two times, so skip
        return Promise.reject("no-send");
        //return Promise.resolve(true);
    }
}