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

module.exports.getNextEventByTypeAndChannel = async function (type, channelId) {
    let events;

    // We do not try-catch the entire function since if getParametersFromDescription rejects
    // (i.e. if an event is formatted wrong) we don't want to ignore the rest of the possible events
    try {
        events = await this.getNextEvents(20);
    } catch (error) {
        console.log(JSON.stringify(error));
        return Promise.reject(error);
    }

    for (var event of events.data.items) {
        if (event.description === undefined || event.description === "") continue;

        event.description = event.description.replace(/<.*?>/g, "");

        let parameters;
        try {
            parameters = await this.getParametersFromDescription(event, require("./slack-handler").defaultChannels);
        } catch (error) {
            console.log(error);
            continue;
        }

        if (parameters.eventType != type) continue;

        if (parameters.mainChannel !== channelId) continue;
        return Promise.resolve(event);
    }
    return Promise.reject("Next event not found");
};

module.exports.getParametersFromDescription = async function (event, defaultChannels) {
    var parameters;

    try {
        parameters = JSON.parse(event.description);
    } catch (exception) {
        return Promise.reject("Upcoming *" + summary + "* contains malformed JSON: " + exception);
    }

    switch (parameters.eventType) {
        case "meeting":
            break;
        case "test":
            break;
        case "other":
            break;
        case "none":
            return Promise.reject("no-send");
        default:
            return Promise.reject("Upcoming *" + summary + "* contains an unknown or missing `eventType`");
    }

    switch (parameters.alertType) {
        case "alert":
            break;
        case "alert-single-channel":
            break;
        case "alert-main-channel":
            break;
        case "copy":
            break;
        default:
            return Promise.reject("Upcoming *" + summary + "* contains an unknown or missing `alertType`");
    }

    if (parameters.mainChannel === undefined || parameters.mainChannel === "") {
        return Promise.reject("Upcoming meeting *" + summary + "* is missing a `mainChannel` element");
    }

    if (parameters.additionalChannels === "default") {
        parameters.additionalChannels = defaultChannels;
    }

    if (!Array.isArray(parameters.additionalChannels)) {
        return Promise.reject("Upcoming meeting *" + summary + "* contains a malformed or missing `additional_channel` element");
    }

    // Get rid of the mainChannel if it is within additional channels
    parameters.additionalChannels = parameters.additionalChannels.filter(value => value != parameters.mainChannel);

    if (parameters.agendaItems === undefined || parameters.agendaItems === "") {
        parameters.agendaItems = [];
    }

    if (parameters.agendaItems !== "" && !Array.isArray(parameters.agendaItems)) {
        return Promise.reject("Upcoming meeting *" + summary + "* contains a malformed `agenda` element");
    }

    if (parameters.link === undefined || parameters.link === "") {
        parameters.link = "https://meet.jit.si/bay_area";
    }

    if (parameters.eventType === undefined || parameters.eventType === "") {
        parameters.link = "meeting";
    }

    if (event.location === undefined || event.location === "") {
        parameters.location = "";
    } else {
        parameters.location = event.location;
    }

    return parameters;
};
