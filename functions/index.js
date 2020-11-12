const functions = require("firebase-functions");
const slack = require("./handlers/slack-handler");
const events = require("./scheduled/events");
const errors = require("./handlers/error-handler");
const initialize = require("./interactivity/initialize");
const https = require("https");

// prettier-ignore
exports.slack_commands = functions.https.onRequest((request, response) => {
    response.status(200).send("Command recieved. Please wait a minimum of 10 seconds for a response before attempting again.");

    // This is what keeps the function hot
    if(request.body === undefined || request.body.channel_name === undefined)  {
        console.log("Keep function hot");
        require("./handlers/command-handler");
        require("./handlers/calendar-handler");
        require("./handlers/error-handler");
        require("./handlers/slack-handler");
        require("./handlers/interactivity-handler");
        require("./commands/meeting/edit");
        require("./commands/meeting/reminder");
        require("./commands/meeting");
        require("./commands/notify");
        require("./scheduled/events");
        require("./interactivity/initialize");
        require("./blocks/error.json");
        require("./blocks/initialize.json");
        require("./blocks/loading.json");
        require("./blocks/meeting.json");
        return;
    }

    // handle requests that have do not originate from slack? i.e if request has no body
    require("./handlers/command-handler").process(request.body).then(result => {
        if (result !== undefined && result != "") {
            slack.postEphemeralMessage(result, request.body.channel_name, request.body.user_id);
        }
    }).catch(async error => {
        try {
            await errors.filter(error);
        } catch(error) {
            slack.postMessageToChannel("```" + JSON.stringify(error, null, 4) + "```", "minerva-log", false);

            //If there's an error sending this message, well, the bot just won't respond, in which case you know theres something wrong.
            slack.postEphemeralMessage(
                "Command failed: " + error + "\nSee https://github.com/waterloo-rocketry/minerva for help with commands.",
                request.body.channel_name,
                request.body.user_id
            );
        }
    });
});

// The format of the schedule string corresponds to: https://man7.org/linux/man-pages/man5/crontab.5.html or verbage (i.e. every 2 minutes)
// We can specify a timezone, but in this case it does not matter. Default is Pacific time which has the same minute # as Eastern (only hours are changed)
// prettier-ignore
exports.scheduled = functions.pubsub.schedule("every 1 minutes").timeZone("America/New_York").onRun(context => {
    // Call the command function to keep it hot
    https.get("https://us-central1-rocketry-minerva-dev.cloudfunctions.net/slack_commands");
    if (new Date().getMinutes % 5 === 0) {
        events.checkForEvents()
            .then(() => {
                // Do nothing
            })
            .catch(async error => {
                try {
                    await errors.filter(error);
                } catch (error) {
                    console.log(JSON.stringify(error));
                    slack.postMessageToChannel("Error with upcoming meeting:\n" + error, "minerva-log", false);
                }
            });
    }
    // Check for events to initialize
    if (new Date().getMinutes === 0) {
        initialize.send()
            .then(() => {
                // Do nothing
            })
            .catch(error => {
                console.log(error);
            });
    }
    return "scheduled";
});

exports.interactivity = functions.https.onRequest((request, response) => {
    response.status(200).send();

    const payload = JSON.parse(request.body.payload);

    let metadata;
    if (payload.type === "view_submission") {
        metadata = JSON.parse(payload.view.private_metadata);
    } else if (payload.type === "block_actions" && payload.channel != undefined) {
        metadata = {
            channel: payload.channel.id,
            type: "initialize",
            subject: payload.actions[0].value,
        };
    } else {
        return;
    }

    require("./handlers/interactivity-handler")
        .process(payload, metadata)
        .then(result => {
            if (result !== undefined && result != "") {
                slack.postEphemeralMessage(result, metadata.channel, payload.user.id);
            }
        })
        .catch(async error => {
            try {
                await errors.filter(error);
            } catch (error) {
                console.log(JSON.stringify(error));
                slack.postMessageToChannel("```" + JSON.stringify(error, null, 4) + "```", "minerva-log", false);
            }
        });
});
