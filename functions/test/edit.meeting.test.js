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
                    private_metadata: `{\"event_id\":\"123456789\",\"channel\":\"C014J93U4JZ\",\"subject\":\"F20 Weekly Meetings\",\"type\":\"meeting_update\"}`,
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
                                    text: " ",
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

    describe("extractMeetingParameters", async function () {
        it("check null meeting block items", async function () {
            assert.deepStrictEqual(
                await edit.extractMeetingParameters(
                    {
                        state: {
                            values: {
                                alert_type: {
                                    alert_type: {
                                        selected_option: null,
                                        type: "static_select",
                                    },
                                },
                                location: {
                                    location: {
                                        value: null,
                                        type: "plain_text_input",
                                    },
                                },
                                link: {
                                    link: {
                                        type: "plain_text_input",
                                        value: null,
                                    },
                                },
                                additional_channels: {
                                    additional_channels: {
                                        selected_channels: [],
                                        type: "multi_channels_select",
                                    },
                                },
                                agenda_items: {
                                    agenda_items: {
                                        value: null,
                                        type: "plain_text_input",
                                    },
                                },
                                notes: {
                                    notes: {
                                        value: null,
                                        type: "plain_text_input",
                                    },
                                },
                                update_type: {
                                    update_type: {
                                        selected_option: {
                                            value: "next",
                                            text: {
                                                emoji: true,
                                                text: "This meeting",
                                                type: "plain_text",
                                            },
                                        },
                                        type: "radio_buttons",
                                    },
                                },
                                main_channel: {
                                    main_channel: {
                                        type: "channels_select",
                                        selected_channel: "C014J93U4JZ",
                                    },
                                },
                            },
                        },
                        blocks: [
                            {
                                text: {
                                    verbatim: false,
                                    text: "Editing meeting: *S20 Weekly Meetings* occuring on *November 4th, 2020 at 7:30 PM*",
                                    type: "mrkdwn",
                                },
                                type: "section",
                                block_id: "meeting_title",
                            },
                            {
                                type: "divider",
                                block_id: "Wxcg2",
                            },
                            {
                                block_id: "location",
                                label: {
                                    text: "Meeting Location",
                                    type: "plain_text",
                                    emoji: true,
                                },
                                optional: true,
                                element: {
                                    type: "plain_text_input",
                                    dispatch_action_config: {
                                        trigger_actions_on: ["on_enter_pressed"],
                                    },
                                    placeholder: {
                                        type: "plain_text",
                                        text: "E5 2001",
                                        emoji: true,
                                    },
                                    action_id: "location",
                                },
                                type: "input",
                                dispatch_action: false,
                            },
                            {
                                block_id: "TvK",
                                type: "divider",
                            },
                            {
                                optional: true,
                                block_id: "link",
                                type: "input",
                                element: {
                                    action_id: "link",
                                    dispatch_action_config: {
                                        trigger_actions_on: ["on_enter_pressed"],
                                    },
                                    initial_value: "https://meet.jit.si/bay_area",
                                    placeholder: {
                                        text: "https://meet.jit.si/bay_area",
                                        emoji: true,
                                        type: "plain_text",
                                    },
                                    type: "plain_text_input",
                                },
                                label: {
                                    type: "plain_text",
                                    emoji: true,
                                    text: "Meeting URL",
                                },
                                dispatch_action: false,
                            },
                            {
                                type: "divider",
                                block_id: "IgB",
                            },
                            {
                                type: "section",
                                block_id: "main_channel",
                                accessory: {
                                    placeholder: {
                                        text: "Select channels",
                                        type: "plain_text",
                                        emoji: true,
                                    },
                                    action_id: "main_channel",
                                    initial_channel: "C014J93U4JZ",
                                    type: "channels_select",
                                },
                                text: {
                                    text: "Main channel",
                                    type: "mrkdwn",
                                    verbatim: false,
                                },
                            },
                            {
                                type: "divider",
                                block_id: "BmaZ+",
                            },
                            {
                                block_id: "additional_channels",
                                accessory: {
                                    initial_channels: [
                                        "C01535M46SC",
                                        "C8VL7QCG0",
                                        "CCWGTJH7F",
                                        "C4H4NJG77",
                                        "C07MWEYPR",
                                        "C07MX0QDS",
                                        "C90E34QDD",
                                        "CV7S1E49Y",
                                        "C07MXA613",
                                        "C07MX5JDB",
                                    ],
                                    type: "multi_channels_select",
                                    action_id: "additional_channels",
                                    placeholder: {
                                        emoji: true,
                                        type: "plain_text",
                                        text: "Select channels",
                                    },
                                },
                                type: "section",
                                text: {
                                    type: "mrkdwn",
                                    text: "Additional Channels",
                                    verbatim: false,
                                },
                            },
                            {
                                type: "divider",
                                block_id: "Y=S",
                            },
                            {
                                element: {
                                    multiline: true,
                                    type: "plain_text_input",
                                    dispatch_action_config: {
                                        trigger_actions_on: ["on_enter_pressed"],
                                    },
                                    initial_value: "",
                                    placeholder: {
                                        emoji: true,
                                        type: "plain_text",
                                        text: "Item 1\nItem 2",
                                    },
                                    action_id: "agenda_items",
                                },
                                dispatch_action: false,
                                block_id: "agenda_items",
                                optional: true,
                                label: {
                                    type: "plain_text",
                                    emoji: true,
                                    text: "Agenda Items",
                                },
                                type: "input",
                            },
                            {
                                type: "divider",
                                block_id: "Cfy4t",
                            },
                            {
                                block_id: "notes",
                                optional: true,
                                label: {
                                    type: "plain_text",
                                    text: "Notes",
                                    emoji: true,
                                },
                                element: {
                                    initial_value: "230 AM",
                                    placeholder: {
                                        type: "plain_text",
                                        text: " ",
                                        emoji: true,
                                    },
                                    dispatch_action_config: {
                                        trigger_actions_on: ["on_enter_pressed"],
                                    },
                                    action_id: "notes",
                                    type: "plain_text_input",
                                },
                                dispatch_action: false,
                                type: "input",
                            },
                            {
                                block_id: "U6lkr",
                                type: "divider",
                            },
                            {
                                type: "section",
                                block_id: "alert_type",
                                text: {
                                    verbatim: false,
                                    type: "mrkdwn",
                                    text: "Alert Type",
                                },
                                accessory: {
                                    placeholder: {
                                        text: "alert-single-channel",
                                        type: "plain_text",
                                        emoji: true,
                                    },
                                    type: "static_select",
                                    action_id: "alert_type",
                                    options: [
                                        {
                                            value: "alert-single-channel",
                                            text: {
                                                text: "Alert single channel",
                                                type: "plain_text",
                                                emoji: true,
                                            },
                                        },
                                        {
                                            value: "alert",
                                            text: {
                                                emoji: true,
                                                type: "plain_text",
                                                text: "Alert",
                                            },
                                        },
                                        {
                                            text: {
                                                emoji: true,
                                                text: "Copy",
                                                type: "plain_text",
                                            },
                                            value: "copy",
                                        },
                                    ],
                                },
                            },
                            {
                                type: "divider",
                                block_id: "JWevL",
                            },
                            {
                                accessory: {
                                    action_id: "update_type",
                                    options: [
                                        {
                                            value: "next",
                                            text: {
                                                text: "This meeting",
                                                type: "plain_text",
                                                emoji: true,
                                            },
                                        },
                                        {
                                            value: "all",
                                            text: {
                                                type: "plain_text",
                                                text: "Future meetings",
                                                emoji: true,
                                            },
                                        },
                                    ],
                                    type: "radio_buttons",
                                    initial_option: {
                                        value: "next",
                                        text: {
                                            text: "This meeting",
                                            type: "plain_text",
                                            emoji: true,
                                        },
                                    },
                                },
                                text: {
                                    type: "mrkdwn",
                                    text:
                                        "Update just this meeting or all future S20 Weekly Meetings?\n*Note: this feature has not been implemented yet. Right now, only the next meeting will be updated.*",
                                    verbatim: false,
                                },
                                type: "section",
                                block_id: "update_type",
                            },
                        ],
                    },
                    {
                        event_id: "123456789",
                        channel: "C014J93U4JZ",
                        subject: "S20 Weekly Meetings",
                        type: "meeting_update",
                    }
                ),
                {
                    eventType: "meeting",
                    mainChannel: "C014J93U4JZ",
                    additionalChannels: [],
                    alertType: "alert-single-channel",
                    location: "",
                    agendaItems: [],
                    notes: "",
                    link: "",
                    updateType: "next",
                    eventId: "123456789",
                }
            );
        });
        it("non-null meeting block items", async function () {
            assert.deepStrictEqual(
                await edit.extractMeetingParameters(
                    {
                        state: {
                            values: {
                                alert_type: {
                                    alert_type: {
                                        selected_option: "copy",
                                        type: "static_select",
                                    },
                                },
                                location: {
                                    location: {
                                        value: "E5 2001",
                                        type: "plain_text_input",
                                    },
                                },
                                link: {
                                    link: {
                                        type: "plain_text_input",
                                        value: "https://meet.jit.si/bay_area",
                                    },
                                },
                                additional_channels: {
                                    additional_channels: {
                                        selected_channels: [
                                            "C01535M46SC",
                                            "C8VL7QCG0",
                                            "CCWGTJH7F",
                                            "C4H4NJG77",
                                            "C07MWEYPR",
                                            "C07MX0QDS",
                                            "C90E34QDD",
                                            "CV7S1E49Y",
                                            "C07MXA613",
                                            "C07MX5JDB",
                                        ],
                                        type: "multi_channels_select",
                                    },
                                },
                                agenda_items: {
                                    agenda_items: {
                                        value: "- item\n- item2",
                                        type: "plain_text_input",
                                    },
                                },
                                notes: {
                                    notes: {
                                        value: "A note",
                                        type: "plain_text_input",
                                    },
                                },
                                update_type: {
                                    update_type: {
                                        selected_option: {
                                            value: "next",
                                            text: {
                                                emoji: true,
                                                text: "This meeting",
                                                type: "plain_text",
                                            },
                                        },
                                        type: "radio_buttons",
                                    },
                                },
                                main_channel: {
                                    main_channel: {
                                        type: "channels_select",
                                        selected_channel: "C014J93U4JZ",
                                    },
                                },
                            },
                        },
                        blocks: [
                            {
                                text: {
                                    verbatim: false,
                                    text: "Editing meeting: *S20 Weekly Meetings* occuring on *November 4th, 2020 at 7:30 PM*",
                                    type: "mrkdwn",
                                },
                                type: "section",
                                block_id: "meeting_title",
                            },
                            {
                                type: "divider",
                                block_id: "Wxcg2",
                            },
                            {
                                block_id: "location",
                                label: {
                                    text: "Meeting Location",
                                    type: "plain_text",
                                    emoji: true,
                                },
                                optional: true,
                                element: {
                                    type: "plain_text_input",
                                    dispatch_action_config: {
                                        trigger_actions_on: ["on_enter_pressed"],
                                    },
                                    placeholder: {
                                        type: "plain_text",
                                        text: "E5 2001",
                                        emoji: true,
                                    },
                                    action_id: "location",
                                },
                                type: "input",
                                dispatch_action: false,
                            },
                            {
                                block_id: "TvK",
                                type: "divider",
                            },
                            {
                                optional: true,
                                block_id: "link",
                                type: "input",
                                element: {
                                    action_id: "link",
                                    dispatch_action_config: {
                                        trigger_actions_on: ["on_enter_pressed"],
                                    },
                                    initial_value: "https://meet.jit.si/bay_area",
                                    placeholder: {
                                        text: "https://meet.jit.si/bay_area",
                                        emoji: true,
                                        type: "plain_text",
                                    },
                                    type: "plain_text_input",
                                },
                                label: {
                                    type: "plain_text",
                                    emoji: true,
                                    text: "Meeting URL",
                                },
                                dispatch_action: false,
                            },
                            {
                                type: "divider",
                                block_id: "IgB",
                            },
                            {
                                type: "section",
                                block_id: "main_channel",
                                accessory: {
                                    placeholder: {
                                        text: "Select channels",
                                        type: "plain_text",
                                        emoji: true,
                                    },
                                    action_id: "main_channel",
                                    initial_channel: "C014J93U4JZ",
                                    type: "channels_select",
                                },
                                text: {
                                    text: "Main channel",
                                    type: "mrkdwn",
                                    verbatim: false,
                                },
                            },
                            {
                                type: "divider",
                                block_id: "BmaZ+",
                            },
                            {
                                block_id: "additional_channels",
                                accessory: {
                                    initial_channels: [
                                        "C01535M46SC",
                                        "C8VL7QCG0",
                                        "CCWGTJH7F",
                                        "C4H4NJG77",
                                        "C07MWEYPR",
                                        "C07MX0QDS",
                                        "C90E34QDD",
                                        "CV7S1E49Y",
                                        "C07MXA613",
                                        "C07MX5JDB",
                                    ],
                                    type: "multi_channels_select",
                                    action_id: "additional_channels",
                                    placeholder: {
                                        emoji: true,
                                        type: "plain_text",
                                        text: "Select channels",
                                    },
                                },
                                type: "section",
                                text: {
                                    type: "mrkdwn",
                                    text: "Additional Channels",
                                    verbatim: false,
                                },
                            },
                            {
                                type: "divider",
                                block_id: "Y=S",
                            },
                            {
                                element: {
                                    multiline: true,
                                    type: "plain_text_input",
                                    dispatch_action_config: {
                                        trigger_actions_on: ["on_enter_pressed"],
                                    },
                                    initial_value: "",
                                    placeholder: {
                                        emoji: true,
                                        type: "plain_text",
                                        text: "Item 1\nItem 2",
                                    },
                                    action_id: "agenda_items",
                                },
                                dispatch_action: false,
                                block_id: "agenda_items",
                                optional: true,
                                label: {
                                    type: "plain_text",
                                    emoji: true,
                                    text: "Agenda Items",
                                },
                                type: "input",
                            },
                            {
                                type: "divider",
                                block_id: "Cfy4t",
                            },
                            {
                                block_id: "notes",
                                optional: true,
                                label: {
                                    type: "plain_text",
                                    text: "Notes",
                                    emoji: true,
                                },
                                element: {
                                    initial_value: "230 AM",
                                    placeholder: {
                                        type: "plain_text",
                                        text: " ",
                                        emoji: true,
                                    },
                                    dispatch_action_config: {
                                        trigger_actions_on: ["on_enter_pressed"],
                                    },
                                    action_id: "notes",
                                    type: "plain_text_input",
                                },
                                dispatch_action: false,
                                type: "input",
                            },
                            {
                                block_id: "U6lkr",
                                type: "divider",
                            },
                            {
                                type: "section",
                                block_id: "alert_type",
                                text: {
                                    verbatim: false,
                                    type: "mrkdwn",
                                    text: "Alert Type",
                                },
                                accessory: {
                                    placeholder: {
                                        text: "alert-single-channel",
                                        type: "plain_text",
                                        emoji: true,
                                    },
                                    type: "static_select",
                                    action_id: "alert_type",
                                    options: [
                                        {
                                            value: "alert-single-channel",
                                            text: {
                                                text: "Alert single channel",
                                                type: "plain_text",
                                                emoji: true,
                                            },
                                        },
                                        {
                                            value: "alert",
                                            text: {
                                                emoji: true,
                                                type: "plain_text",
                                                text: "Alert",
                                            },
                                        },
                                        {
                                            text: {
                                                emoji: true,
                                                text: "Copy",
                                                type: "plain_text",
                                            },
                                            value: "copy",
                                        },
                                    ],
                                },
                            },
                            {
                                type: "divider",
                                block_id: "JWevL",
                            },
                            {
                                accessory: {
                                    action_id: "update_type",
                                    options: [
                                        {
                                            value: "next",
                                            text: {
                                                text: "This meeting",
                                                type: "plain_text",
                                                emoji: true,
                                            },
                                        },
                                        {
                                            value: "all",
                                            text: {
                                                type: "plain_text",
                                                text: "Future meetings",
                                                emoji: true,
                                            },
                                        },
                                    ],
                                    type: "radio_buttons",
                                    initial_option: {
                                        value: "next",
                                        text: {
                                            text: "This meeting",
                                            type: "plain_text",
                                            emoji: true,
                                        },
                                    },
                                },
                                text: {
                                    type: "mrkdwn",
                                    text:
                                        "Update just this meeting or all future S20 Weekly Meetings?\n*Note: this feature has not been implemented yet. Right now, only the next meeting will be updated.*",
                                    verbatim: false,
                                },
                                type: "section",
                                block_id: "update_type",
                            },
                        ],
                    },
                    {
                        event_id: "123456789",
                        channel: "C014J93U4JZ",
                        subject: "S20 Weekly Meetings",
                        type: "meeting_update",
                    }
                ),
                {
                    eventType: "meeting",
                    mainChannel: "C014J93U4JZ",
                    additionalChannels: [
                        "C01535M46SC",
                        "C8VL7QCG0",
                        "CCWGTJH7F",
                        "C4H4NJG77",
                        "C07MWEYPR",
                        "C07MX0QDS",
                        "C90E34QDD",
                        "CV7S1E49Y",
                        "C07MXA613",
                        "C07MX5JDB",
                    ],
                    alertType: "copy",
                    location: "E5 2001",
                    agendaItems: ["item", "item2"],
                    notes: "A note",
                    link: "https://meet.jit.si/bay_area",
                    updateType: "next",
                    eventId: "123456789",
                }
            );
        });
    });
});
