const {google} = require("googleapis");
const calendar = google.calendar("v3");
const functions = require("firebase-functions");

const auth = new google.auth.OAuth2(functions.config().googleaccount.client, functions.config().googleaccount.secret, functions.config().googleaccount.redirect);

auth.setCredentials({
    refresh_token: functions.config().googleaccount.token,
});

// Returns next n events. Commonly used data in result.data.items
module.exports.getNextEvents = function (number = 1) {
    return calendar.events.list({
        auth: auth,
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        maxResults: number,
        singleEvents: true,
        orderBy: "startTime",
    });
};

module.exports.getEventById = function (eventId) {
    return calendar.events.get({
        auth: auth,
        calendarId: "primary",
        eventId: eventId,
    });
};

module.exports.updateEventById = function (eventId, updatedFields) {
    return calendar.events.patch({
        auth: auth,
        calendarId: "primary",
        eventId: eventId,
        requestBody: updatedFields,
    });
};

module.exports.getNextEventByTypeAndChannel = async function (type, channelName) {
    try {
        const events = await this.getNextEvents(20);

        for (var event of events.data.items) {
            if (event.description === undefined || event.description === "") continue;

            const lines = event.description.split("\n");

            if (lines[0] != type) continue;

            if (lines[2] !== "#" + channelName) continue;
            return Promise.resolve(event);
        }
        return Promise.reject("Next event not found");
    } catch (error) {
        console.log(JSON.stringify(error));
        return Promise.reject(error);
    }
};

module.exports.getParametersFromDescription = async function (summary, description, defaultChannels) {
    var parameters;

    try {
        parameters = JSON.parse(description);
    } catch (exception) {
        return Promise.reject("Upcoming *" + meeting + "* contains malformed JSON");
    }

    switch (parameters.event_type) {
        case "meeting":
            break;
        case "test":
            break;
        case "other":
            break;
        case "none":
            return Promise.reject("no-send");
        default:
            return Promise.reject("Upcoming *" + summary + "* contains an unknown or missing `event_type`");
    }

    switch (parameters.alert_type) {
        case "alert":
            break;
        case "alert-single-channel":
            break;
        case "alert-main-channel":
            break;
        case "copy":
            break;
        default:
            return Promise.reject("Upcoming *" + summary + "* contains an unknown or missing `alert_type`");
    }

    if (parameters.main_channel === undefined || parameters.main_channel === "") {
        return Promise.reject("Upcoming meeting *" + summary + "* is missing a `main_channel` element");
    }

    if (parameters.additional_channels === "default") {
        parameters.additional_channels = defaultChannels;
    }

    if (!Array.isArray(parameters.additional_channels)) {
        return Promise.reject("Upcoming meeting *" + summary + "* contains a malformed or missing `additional_channel` element");
    }

    // Get rid of the main_channel if it is within additional channels
    parameters.additional_channels = parameters.additional_channels.filter(value => value != parameters.main_channel);

    if (parameters.agenda !== "" && !Array.isArray(parameters.agenda)) {
        return Promise.reject("Upcoming meeting *" + summary + "* contains a malformed `agenda` element");
    }

    // parameters.agenda_string = "";

    // for (var i = 0; i < parameters.agenda.length; i++) {
    //     parameters.agenda_string += "\n    • " + parameters.agenda[i].trim();
    // }

    // // delete parameters.agenda since its no longer needed
    // delete parameters.agenda;

    return parameters;
};
