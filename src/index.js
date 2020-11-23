exports.slack_commands_sync = async (event, context) => {
    if (event === null || event === undefined || event.body === undefined) {
        console.log("Keep function hot");
        return;
    }

    const body = require("querystring").parse(event.body);

    await new Promise((resolve, reject) => {
        const req = require("https").request(
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

    require("./handlers/environment-handler").setDefaults(context);
    const slack = require("./handlers/slack-handler");

    const body = JSON.parse(event.body);

    try {
        const result = await require("./handlers/command-handler").process(body);
        if (result != undefined) {
            await slack.postEphemeralMessage(result, body.channel_name, body.user_id);
        }
    } catch (error) {
        try {
            await require("./handlers/error-handler").filter(error);
        } catch (error) {
            console.log(error);

            await slack.postMessageToChannel("```" + error + "```", "minerva-log", false);

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
    require("./handlers/environment-handler").setDefaults(context);
    const slack = require("./handlers/slack-handler");

    // Check for event reminders every 5 minutes
    if (new Date().getMinutes() % 5 === 0) {
        try {
            await require("./scheduled/events").checkForEvents();
        } catch(error) {
            try {
                await require("./handlers/error-handler").filter(error);
            } catch (error) {
                console.log(error);
                slack.postMessageToChannel("Error with upcoming meeting:\n`" + error + "`", "minerva-log", false);
            }
        }
    }
    // Check for events to initialize once an hour
    if (new Date().getMinutes() === 0) {
        try {
            await require("./interactivity/initialize").send();
        } catch(error) {
            console.log(error);
        }
    }
    return "scheduled";
}

exports.interactivity_sync = async (event, context) => {
    if (event === null || event === undefined || event.body === undefined) {
        console.log("Keep function hot");
        return;
    }

    const payload = require("querystring").parse(event.body).payload;

    await new Promise((resolve, reject) => {
        const req = require("https").request(
            "https://w81to1ds7f.execute-api.us-east-1.amazonaws.com/development/minerva-interactivityAsync-1ZL8L59GESDW",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": JSON.stringify(payload).length,
                },
            },
            res => {}
        );
        req.write(JSON.stringify(payload));
        req.end();
        setTimeout(() => {
            resolve();
        }, 600);
    });

    return {
        statusCode: 200,
    };
};

exports.interactivity_async = async (event, context) => {
    require("./handlers/environment-handler").setDefaults(context);

    const slack = require("./handlers/slack-handler");
    const payload = JSON.parse(JSON.parse(event.body));

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

    try {
        const result = await require("./handlers/interactivity-handler").process(payload, metadata);
        if (result != undefined) {
            await slack.postEphemeralMessage(result, metadata.channel, payload.user.id);
        }
    } catch (error) {
        try {
            await require("./handlers/error-handler").filter(error);
        } catch (error) {
            console.log(error);

            await slack.postMessageToChannel("```" + error + "```", "minerva-log", false);

            await slack.postEphemeralMessage(
                "Command failed: " + error + "\nSee https://github.com/waterloo-rocketry/minerva for help with commands.",
                metadata.channel,
                payload.user.id
            );
        }
    }
};
