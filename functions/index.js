const functions = require("firebase-functions");
const slack = require("./handlers/slack-handler");
const events = require("./scheduled/events");
const https = require("https");

// prettier-ignore
exports.slack_commands = functions.https.onRequest((request, response) => {
    response.status(200).send("Command recieved. Please wait a minimum of 10 seconds for a response before attempting again.");
    if(request.body === undefined || request.body.channel_name === undefined) return;

    // handle requests that have do not originate from slack? i.e if request has no body
    require("./handlers/command-handler").process(request.body).then(result => {
        if (result !== undefined && result != "") {
            slack.postEphemeralMessage(result, request.body.channel_name, request.body.user_id);
        }
    }).catch(error => {
        console.log(error);
        slack.postMessageToChannel("```" + JSON.stringify(error, null, 4) + "```", "minerva-log", false);

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
exports.event_check = functions.pubsub.schedule("every 2 minutes").timeZone("America/New_York").onRun(context => {
    https.get("https://us-central1-rocketry-minerva-dev.cloudfunctions.net/slack_commands");
    events.checkForEvents()
    .then(() => {
        // do nothing
    })
    .catch(error => {
        console.log(error);
        console.log(JSON.stringify(error));
        slack.postMessageToChannel("Error with upcoming meeting:\n" + error, "minerva-log", false);
    });
    return "Ran meeting check";
});

exports.interactivity = functions.https.onRequest((request, response) => {
    console.log(request);
    response.status(200).send("Recieved");
});
