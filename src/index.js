const slack = require("./handlers/slack-handler");
const events = require("./scheduled/events");
const errors = require("./handlers/error-handler");
const initialize = require("./interactivity/initialize");
const https = require("https");
const qs = require("querystring");

exports.slack_commands_sync = async (event, context) => {
    if (event === null || event === undefined || event.body === undefined) {
        console.log("Keep function hot");
        return;
    }

    const body = qs.parse(event.body);

    await new Promise((resolve, reject) => {
        const req = https.request(
            "https://k0a0yv69m5.execute-api.us-east-1.amazonaws.com/development/minerva-slackCommandsAsynchronous-1K6EO00AY77QT",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": JSON.stringify(body).length,
                },
            },
            res => {}
        );

        req.write(JSON.stringify(body));
        req.end();

        setTimeout(() => {
            resolve();
        }, 400);
    });

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
        },
        body: "Command Recieved. Please wait up to 10 seconds before trying again.",
    };
};

exports.slack_commands_async = async (event, context) => {
    if (event === null || event === undefined || event.body === undefined) {
        console.log("Keep function hot");
        return;
    }

    const body = JSON.parse(event.body);

    try {
        const result = await require("./handlers/command-handler").process(body);
        if (result != undefined) {
            await slack.postEphemeralMessage(result, body.channel_name, body.user_id);
        }
    } catch (error) {
        try {
            await errors.filter(error);
        } catch (error) {
            await slack.postMessageToChannel("```" + JSON.stringify(error, null, 4) + "```", "minerva-log", false);

            await slack.postEphemeralMessage(
                "Command failed: " + error + "\nSee https://github.com/waterloo-rocketry/minerva for help with commands.",
                body.channel_name,
                body.user_id
            );
        }
    }
};

// The format of the schedule string corresponds to: https://man7.org/linux/man-pages/man5/crontab.5.html or verbage (i.e. every 2 minutes)
// We can specify a timezone, but in this case it does not matter. Default is Pacific time which has the same minute # as Eastern (only hours are changed)
// prettier-ignore
exports.scheduled = async (event, context) => {
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
}

exports.interactivity = async (event, context) => {
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
};
