const slack_handler = require("../handlers/slack-handler");
const calendar_handler = require("../handlers/calendar-handler");
const edit = require("../commands/meeting/edit");

module.exports.send = async function () {
    // Identify any events in the next 10 that don't have a defined description, if they do, send a inquiry to initialize it.
    const events = (await calendar_handler.getNextEvents(10)).data.items;
    const inquiries = [];
    for (let event of events) {
        if (event.description === "" || event.description === undefined) {
            inquiries.push(this.inquire(event));
        }
    }
    await Promise.all(inquiries);
};

module.exports.receive = async function (eventId, trigger) {
    var view;
    try {
        view = await slack_handler.openView(trigger, require("../blocks/loading.json"));

        const event = (await calendar_handler.getEventById(eventId)).data;

        const parameters = {
            eventType: "meeting",
            mainChannel: "C015FSK7FQE", // Give it an initial value, thus forcing a channel to be chosen
            additionalChannels: [],
            alertType: "alert-single-channel",
            agendaItems: [],
            notes: "",
            location: "",
            link: "https://meet.jit.si/bay_area",
        };

        const meetingBlock = await edit.parseMeetingBlock(event, parameters);

        await slack_handler.updateView(view.view.id, meetingBlock);
    } catch (error) {
        if (view != undefined) {
            const errorBlock = require("../blocks/error.json");
            errorBlock.blocks[0].text.text = "An error has occured:\n\n*" + error + "*\n\nSee https://github.com/waterloo-rocketry/minerva for help with commands.";

            await slack_handler.updateView(view.view.id, errorBlock);
        }
        return Promise.reject(error);
    }
};

module.exports.inquire = async function (event) {
    const initializeBlock = JSON.parse(JSON.stringify(require("../blocks/initialize.json")));
    initializeBlock[0].text.text = event.summary + " contains an undefined description.\n\nWould you like to initialize it?";
    initializeBlock[1].elements[0].value = event.id;

    await slack_handler.postInteractiveMessage(initializeBlock, "minerva-log");
};
