const functions = require('firebase-functions');
const commands = require('./handlers/command-handler');
const slack = require('./handlers/slack-handler');

exports.minerva = functions.https.onRequest((request, response) => {
    response.status(200).send("Command recieved");
    console.log(request.body);
    commands.process(request.body).then((result) => {
        //slack.postEphemeralMessage(request.body.user_id, "Command successful", 'general');
    }).catch((error) => {
        console.log(error);
        //If there's an error here, well, the bot just won't respond, in which case you know theres something wrong.
        slack.postEphemeralMessage(request.body.user_id, "Command failed: " + error, 'general');
    });
});
