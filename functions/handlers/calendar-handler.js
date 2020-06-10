const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const calendar = google.calendar('v3');

const credentials = require('../credentials.json');
const auth = new OAuth2(
    credentials.web.client_id,
    credentials.web.client_secret,
    credentials.web.redirect_uris[0]
)

auth.setCredentials({
    refresh_token: credentials.refresh_token
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

module.exports.updateNextEventWhoStartsWith = function (channel) {
    // update the next event whos description starts with #<name> of the 
    // make sure the add command is not escaped so that regular names can be used here. I do not want to have to make a name conversion command
    // description of events need to start with the primary channel first, then secondary (copy-to) channels after
    // i.e. electrical meetings need to start with #electrical in the description, then other channels it wants to alert (i.e. payload, software, etc)
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

