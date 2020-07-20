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

module.exports.getNextEventByTypeAndChannel = async function (type, channel) {
    try {
        const events = await this.getNextEvents(20);

        for (var event of events.data.items) {
            if (event.description === undefined || event.description === "") continue;

            const lines = event.description.split("\n");

            if (lines[0] != type) continue;

            if (lines[2] !== "#" + channel) continue;
            return Promise.resolve(event);
        }
        return Promise.reject("Next event not found");
    } catch (error) {
        console.log(JSON.stringify(error));
        return Promise.reject(error);
    }
};
