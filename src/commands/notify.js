const slack_handler = require("../handlers/slack-handler");
const environment = require("../handlers/environment-handler");

module.exports.send = async function (userId, trigger, initialChannel) {
    var view;
    try {
        const loadingBlock = JSON.parse(JSON.stringify(require("../blocks/loading.json")));
        loadingBlock.blocks[0].text.text = "Loading notify model...";

        view = await slack_handler.openView(trigger, loadingBlock);

        await slack_handler.isAdmin(userId);

        const notifyBlock = await this.parseNotifyBlock(initialChannel);

        view = await slack_handler.updateView(view.view.id, notifyBlock);
    } catch (error) {
        if (view != undefined) {
            const errorBlock = require("../blocks/error.json");
            errorBlock.blocks[0].text.text = "An error has occured:\n\n*" + error + "*\n\nSee https://github.com/waterloo-rocketry/minerva for help with commands.";

            // Don't 'await' this since we only care to push the update. If they have closed the view or something, the message in chat will still show the error.
            slack_handler.updateView(view.view.id, errorBlock);
        }
        return Promise.reject(error);
    }
};

module.exports.receive = async function (view, metadata) {
    const parameters = await this.extractNotifyParameters(view, metadata);

    const message = (parameters.alertType === "alert" ? "<!channel>\n" : "") + parameters.link;

    if (parameters.alertType === "alert-single-channel") {
        // when we alert single channel guests we simply want to PM them the message
        const responses = await slack_handler.directMessageSingleChannelGuestsInChannels(
            message +
                "\n\n_You have been sent this message because you are a single channel guest who might have otherwise missed this alert.\n\n" +
                "If you're unsure what this message is about, feel free to message the original poster for more information._",
            parameters.channels
        );
        return responses.length + " single-channel-guests messaged.";
    } else {
        // otherwise, just copy the message to the channels. It may have an 'alert' appended to it.
        await Promise.all(slack_handler.postMessageToChannels(message, parameters.channels, true));
    }
};

module.exports.parseNotifyBlock = async function (initialChannel) {
    const notifyBlock = JSON.parse(JSON.stringify(require("../blocks/notify.json")));

    const metadata = {};

    metadata.channel = initialChannel;
    metadata.subject = "";
    metadata.type = "notify";

    notifyBlock.private_metadata = JSON.stringify(metadata);

    return notifyBlock;
};

module.exports.extractNotifyParameters = async function (view) {
    if (view.state.values.alert_type.alert_type.selected_option === null) {
        return Promise.reject("You must select an alert type");
    }

    const parameters = {
        link: view.state.values.link.link.value,
        alertType: view.state.values.alert_type.alert_type.selected_option.value,
        channels: view.state.values.additional_channels.additional_channels.selected_channels,
    };

    const urlPrefix = environment.slackUrl + "/archives/";

    if (!parameters.link.startsWith(urlPrefix)) {
        return Promise.reject("The 'message link' input box must be a link to a Slack message from this workspace");
    }

    const initialChannel = parameters.link.split("/")[4];

    // get rid of the inital channel if it happens to be in the channels
    parameters.channels = parameters.channels.filter(value => value != initialChannel);

    if (parameters.channels.length === 0) {
        return Promise.reject("You must select at least one additional channel, not including the message's original channel");
    }

    return parameters;
};
