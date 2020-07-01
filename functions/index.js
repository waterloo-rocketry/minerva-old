const functions = require("firebase-functions");
const commands = require("./handlers/command-handler");
const slack = require("./handlers/slack-handler");
const events = require("./scheduled/events");
// prettier-ignore
exports.slack_commands = functions.https.onRequest((request, response) => {
    response.status(200).send("Command recieved");
    // handle requests that have do not originate from slack? i.e if request has no body
    commands.process(request.body).then(result => {
        if (result !== undefined && result != "") {
            slack.postEphemeralMessage(result, request.body.channel_name, request.body.user_id);
        }
    }).catch(error => {
        console.log(JSON.stringify(error));
        slack.postMessageToChannel(JSON.stringify(error), "minerva-log");
        //If there's an error sending this message, well, the bot just won't respond, in which case you know theres something wrong.
        slack.postEphemeralMessage(
            "Command failed: " + error + "\nSee: https://github.com/waterloo-rocketry/minerva for help with commands.",
            request.body.channel_name,
            request.body.user_id
        );
    });
});

// The format of the schedule string corresponds to: https://man7.org/linux/man-pages/man5/crontab.5.html
// Run on the 25th and 55th minute of every hour since events start on X:30 or X:00 and we want to alert 5 mins or so ahead
// We can specify a timezone, but in this case it does not matter. Default is Pacific time which has the same minute # as Eastern (only hours are changed)
// prettier-ignore
exports.event_check = functions.pubsub.schedule("25,55 * * * *").timeZone("America/New_York").onRun(context => {events
    .checkForEvents()
    .then(() => {
        // do nothing
    })
    .catch(error => {
        console.log(JSON.stringify(error));
        slack.postMessageToChannel("Error with upcoming meeting:\n" + error, "minerva-log");
    });
    return "Ran meeting check";
});
