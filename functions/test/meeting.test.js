const test = require("firebase-functions-test")();
const assert = require("assert");
const chai = require("chai");
chai.use(require("chai-as-promised"));
const expect = require("chai").expect;

// Although we will not be using any API features, without mocking these values they become undefined and the tests fail
test.mockConfig({
    slack: {
        token: "",
    },
    googleaccount: {
        client: "",
        secret: "",
        redirect: "",
    },
});

const edit = require("../commands/meeting/edit");

describe("commands/meeting/edit.js tests", function () {
    // One test for this should suffice, there is no logic, it's simply a method for changing a JSON object
    describe("parseMeetingBlock", async function () {
        it("parse a meeting block", async function () {
            assert.deepStrictEqual(
                await edit.parseMeetingBlock(
                    {
                        id: "123456789",
                        summary: "F20 Weekly Meetings",
                        start: {
                            dateTime: new Date(2020, 10, 05),
                        },
                    },
                    {
                        eventType: "meeting",
                        mainChannel: "C014J93U4JZ",
                        additionalChannels: ["C0155MGT7NW", "C015BSR32E8", "C0155TL4KKM", "C0155MHAHB4", "C014QV0F9AB", "C014YVDDLTG"],
                        alertType: "alert-single-channel",
                        agendaItems: ["test"],
                        notes: "N/A",
                        location: "E5 2001",
                        link: "https://meet.jit.si/bay_area",
                    }
                ),
                {
                    title: {
                        type: "plain_text",
                        text: "Meeting Editor",
                        emoji: true,
                    },
                    submit: {
                        type: "plain_text",
                        text: "Submit",
                        emoji: true,
                    },
                    type: "modal",
                    close: {
                        type: "plain_text",
                        text: "Cancel",
                        emoji: true,
                    },
                    private_metadata: `{\"event_id\":\"123456789\",\"channel\":\"C014J93U4JZ\",\"summary\":\"F20 Weekly Meetings\"}`,
                    callback_id: "meeting_edit",
                    blocks: [
                        {
                            type: "section",
                            text: {
                                type: "mrkdwn",
                                text: "Editing meeting: *F20 Weekly Meetings* occuring on *November 5th, 2020 at 12:00 AM*",
                            },
                            block_id: "meeting_title",
                        },
                        {
                            type: "divider",
                        },
                        {
                            type: "input",
                            element: {
                                type: "plain_text_input",
                                placeholder: {
                                    type: "plain_text",
                                    text: "E5 2001",
                                },
                                initial_value: "E5 2001",
                                action_id: "location",
                            },
                            label: {
                                type: "plain_text",
                                text: "Meeting Location",
                            },
                            block_id: "location",
                            optional: true,
                        },
                        {
                            type: "divider",
                        },
                        {
                            type: "input",
                            element: {
                                type: "plain_text_input",
                                placeholder: {
                                    type: "plain_text",
                                    text: "https://meet.jit.si/bay_area",
                                },
                                initial_value: "https://meet.jit.si/bay_area",
                                action_id: "link",
                            },
                            label: {
                                type: "plain_text",
                                text: "Meeting URL",
                            },
                            block_id: "link",
                            optional: true,
                        },
                        {
                            type: "divider",
                        },
                        {
                            type: "section",
                            text: {
                                type: "mrkdwn",
                                text: "Main channel",
                            },
                            accessory: {
                                type: "channels_select",
                                placeholder: {
                                    type: "plain_text",
                                    text: "Select channels",
                                    emoji: true,
                                },
                                initial_channel: "C014J93U4JZ",
                                action_id: "main_channel",
                            },
                            block_id: "main_channel",
                        },
                        {
                            type: "divider",
                        },
                        {
                            type: "section",
                            text: {
                                type: "mrkdwn",
                                text: "Additional Channels",
                            },
                            accessory: {
                                type: "multi_channels_select",
                                placeholder: {
                                    type: "plain_text",
                                    text: "Select channels",
                                    emoji: true,
                                },
                                initial_channels: ["C0155MGT7NW", "C015BSR32E8", "C0155TL4KKM", "C0155MHAHB4", "C014QV0F9AB", "C014YVDDLTG"],
                                action_id: "additional_channels",
                            },
                            block_id: "additional_channels",
                        },
                        {
                            type: "divider",
                        },
                        {
                            type: "input",
                            element: {
                                type: "plain_text_input",
                                placeholder: {
                                    type: "plain_text",
                                    text: "- Item 1\n- Item 2",
                                },
                                multiline: true,
                                initial_value: "- test",
                                action_id: "agenda_items",
                            },
                            label: {
                                type: "plain_text",
                                text: "Agenda Items",
                            },
                            block_id: "agenda_items",
                            optional: true,
                        },
                        {
                            type: "divider",
                        },
                        {
                            type: "input",
                            element: {
                                type: "plain_text_input",
                                placeholder: {
                                    type: "plain_text",
                                    text: "",
                                },
                                initial_value: "N/A",
                                action_id: "notes",
                            },
                            label: {
                                type: "plain_text",
                                text: "Notes",
                            },
                            block_id: "notes",
                            optional: true,
                        },
                        {
                            type: "divider",
                        },
                        {
                            type: "section",
                            text: {
                                type: "mrkdwn",
                                text: "Alert Type",
                            },
                            accessory: {
                                type: "static_select",
                                placeholder: {
                                    type: "plain_text",
                                    text: "alert-single-channel",
                                    emoji: true,
                                },
                                options: [
                                    {
                                        text: {
                                            type: "plain_text",
                                            text: "Alert single channel",
                                        },
                                        value: "alert-single-channel",
                                    },
                                    {
                                        text: {
                                            type: "plain_text",
                                            text: "Alert",
                                            emoji: true,
                                        },
                                        value: "alert",
                                    },
                                    {
                                        text: {
                                            type: "plain_text",
                                            text: "Copy",
                                            emoji: true,
                                        },
                                        value: "copy",
                                    },
                                ],
                                action_id: "alert_type",
                            },
                            block_id: "alert_type",
                        },
                        {
                            type: "divider",
                        },
                        {
                            type: "section",
                            text: {
                                type: "mrkdwn",
                                text:
                                    "Update just this meeting or all future F20 Weekly Meetings?" +
                                    "\n*Note: this feature has not been implemented yet. Right now, only the next meeting will be updated.*",
                            },
                            accessory: {
                                type: "radio_buttons",
                                initial_option: {
                                    value: "next",
                                    text: {
                                        type: "plain_text",
                                        text: "This meeting",
                                    },
                                },
                                options: [
                                    {
                                        text: {
                                            type: "plain_text",
                                            text: "This meeting",
                                            emoji: true,
                                        },
                                        value: "next",
                                    },
                                    {
                                        text: {
                                            type: "plain_text",
                                            text: "Future meetings",
                                            emoji: true,
                                        },
                                        value: "all",
                                    },
                                ],
                                action_id: "update_type",
                            },
                            block_id: "update_type",
                        },
                    ],
                }
            );
        });
    });
});
