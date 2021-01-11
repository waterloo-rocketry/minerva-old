exports.slack_commands_sync = async (event, context) => {
    if (event === null || event === undefined || event.body === undefined) {
        console.log("Keep function hot");
        return;
    }

    const body = require("querystring").parse(Buffer.from(event.body, "base64").toString());

    let url;
    if (context.invokedFunctionArn.split(":")[7] === "development") {
        url = "https://32fp9565v0.execute-api.us-east-1.amazonaws.com/development/minerva-slackCommandsAsynchronous-1PP79Q6BVBGZR";
    } else {
        url = "https://podq4oj7s5.execute-api.us-east-1.amazonaws.com/minerva-slackCommandsAsynchronous-1PP79Q6BVBGZR";
    }

    await new Promise((resolve, reject) => {
        const req = require("https").request(
            url,
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
        body: "Command Received. Please wait up to 10 seconds before trying again.",
    };
};

exports.slack_commands_async = async (event, context) => {
    require("./handlers/environment-handler").setDefaults(context);
    if (event === null || event === undefined || event.body === undefined) {
        require("./handlers/environment-handler");
        require("./handlers/command-handler");
        require("./commands/meeting/edit");
        require("./commands/meeting");
        require("./commands/notify");
        console.log("Keep function hot");
        return;
    }

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
    // Check for events to initialize at midnight every night.
    if (new Date().getHours() === 0 && new Date().getMinutes() === 0) {
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

    const payload = require("querystring").parse(Buffer.from(event.body, "base64").toString()).payload;

    let url;
    if (context.invokedFunctionArn.split(":")[7] === "development") {
        url = "https://wrm6nyty89.execute-api.us-east-1.amazonaws.com/development/minerva-interactivityAsync-HNTIX0A0L940";
    } else {
        url = "https://podq4oj7s5.execute-api.us-east-1.amazonaws.com/default/minerva-interactivityAsync-HNTIX0A0L940";
    }

    await new Promise((resolve, reject) => {
        const req = require("https").request(
            url,
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
