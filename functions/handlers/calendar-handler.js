const { google } = require('googleapis');
const calendar = google.calendar('v3');
const functions = require('firebase-functions');

const auth = new google.auth.OAuth2(
    functions.config().calendar.client,
    functions.config().calendar.secret,
    functions.config().calendar.redirect
);

auth.setCredentials({
    refresh_token: functions.config().calendar.token
})

// Returns next n events. Commonly used data in result.data.items
module.exports.getNextEvents = function (number = 1) {
    return calendar.events.list({
        auth: auth,
        calendarId: 'primary',
        timeMin: (new Date()).toISOString(),
        maxResults: number,
        singleEvents: true,
        orderBy: 'startTime'
    });
}

module.exports.getEventById = function (eventId) {
    return calendar.events.get({
        auth: auth,
        calendarId: 'primary',
        eventId: eventId
    })
}

module.exports.updateEventById = function (eventId, description) {
    return calendar.events.get({
        auth: auth,
        calendarId: 'primary',
        eventId: eventId
    })
}

module.exports.getEventByTypeAndChannel = async function (type, channel) {
    try {
        var events = await this.getNextEvents(10);

        for (var event of events.data.items) {
            console.log(event);
            if (event.description === undefined || event.description === "") continue;

            var lines = event.description.split("\n");
            console.log(lines);

            if (lines[0] != type) continue;

            if (lines[2] !== "#" + channel) continue;
            return Promise.resolve(event);
        }
        return Promise.reject("Next event not found");
    } catch (error) {
        console.log("getEventByTypeAndChannel " + error);
        return Promise.reject(error);
    }
}

module.exports.addMeeting = function (name, description, startTime, duration) {
    /*calendar.events.insert({
        auth: auth,
        calendarId: 'primary',
        resource: {
            'summary': data.eventName,
            'description': data.description,
            'start': {
                'dateTime': data.startTime,
                'timeZone': 'EST'
            },
            'end': {
                'dateTime': data.endTime,
                'timezone': 'EST'
            }
        }
    });*/
}

