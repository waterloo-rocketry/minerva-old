const AWS = require('aws-sdk')
const lambda = new AWS.Lambda()

const environment = process.env.NODE_ENV

exports.slack_commands_sync = async (event, context) => {
    if (event === null || event === undefined || event.body === undefined) {
        console.log("Keep function hot");
        return;
    }

    const body = require("querystring").parse(Buffer.from(event.body, "base64").toString());

    console.log(`Sending to minerva-${environment}-slackCommandsAsync...`);

    const params = {
        FunctionName: `minerva-${environment}-slackCommandsAsync`,
        InvocationType: "Event",
        Payload: JSON.stringify(body),
    }

    await new Promise((resolve, reject) => {
        lambda.invoke(params, (err, data) => {
            if (err) {
                console.log(err, err.stack)
                reject()
            } else {
                setTimeout(() => {
                    resolve();
                }, 400);
            }
        })
    })

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
        require("./handlers/command-handler");
        require("./commands/meeting/edit");
        require("./commands/meeting");
        require("./commands/notify");
        require("./interactivity/initialize");
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

// Runs once a minute
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

    console.log(`Sending to minerva-${environment}-interactivityAsync...`);

    const params = {
        FunctionName: `minerva-${environment}-interactivityAsync`,
        InvocationType: "Event",
        Payload: JSON.stringify(payload),
    }

    await new Promise((resolve, reject) => {
        lambda.invoke(params, (err, data) => {
            if (err) {
                console.log(err, err.stack)
                reject()
            } else {
                setTimeout(() => {
                    resolve();
                }, 600);
            }
        })
    })

    return {
        statusCode: 200,
    };
};

exports.interactivity_async = async (event, context) => {
    require("./handlers/environment-handler").setDefaults(context);

    if (event === null || event === undefined || event.body === undefined) {
        require("./commands/meeting/edit");
        require("./commands/notify");
        require("./interactivity/initialize");
        console.log("Keep function hot");
        return;
    }

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
