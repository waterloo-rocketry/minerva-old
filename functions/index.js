const functions = require('firebase-functions');
const commands = require('./handlers/command-handler');
const slack = require('./handlers/slack-handler');
const meetings = require('./handlers/meeting-handler');

exports.slack_commands = functions.https.onRequest((request, response) => {
    response.status(200).send("Command recieved");
    // handle requests that have do not originate from slack? i.e if request
    commands.process(request.body).then((result) => {
        //slack.postEphemeralMessage(request.body.user_id, "Command successful", 'general');
    }).catch((error) => {
        console.log(error);
        //If there's an error sending this message, well, the bot just won't respond, in which case you know theres something wrong.
        slack.postEphemeralMessage(request.body.user_id, "Command failed: " + error, 'general');
    });
});

// The format of the schedule string corresponds to: https://man7.org/linux/man-pages/man5/crontab.5.html
// Run on the 28th and 58th minute of every hour since meetings start on X:30 or X:00 and we want to alert a minute or so ahead
// We can specify a timezone, but in this case it does not matter. Default is Pacific time which has the same minute # as Eastern (only hours are changed)
exports.meeting_check = functions.pubsub.schedule('28,58 * * * *').timeZone('America/New_York').onRun((context) => {
    meetings.checkForMeetings().then(() => {
        // do nothing
    }).catch((error) => {
        slack.postMessageToChannel("Error with upcoming meeting:\n" + error, 'general');
    });
});
