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

require("../handlers/slack-handler").defaultChannels = ["C0155MGT7NW", "C015BSR32E8", "C014J93U4JZ", "C0155TL4KKM", "C0155MHAHB4", "C014QV0F9AB", "C014YVDDLTG"]; // development workspace
const calendar_handler = require("../handlers/calendar-handler.js");
const slack_handler = require("../handlers/slack-handler.js");
const LOWER_BOUND = 300000; // 5 minutes in milliseconds
const UPPER_BOUND = 21600000; // 6 hours in milliseconds

describe("handlers/calenda-handler.js tests", function () {
    describe("parseDescription", function () {
        const channelIDMapping = new Map();
        channelIDMapping.set("general", "C014J93U4JZ");
        channelIDMapping.set("propulsion", "C0155MHAHB4");
        it("parse description, no agenda items", async function () {
            const description = `{
                    "event_type": "meeting",
                    "alert_type": "alert-single-channel",
                    "main_channel": "C014J93U4JZ",
                    "additional_channels": "default",
                    "agenda": "",
                    "extra": "N/A"
                }`;

            assert.deepEqual(await calendar_handler.getParametersFromDescription("Meeting", description, slack_handler.defaultChannels), {
                event_type: "meeting",
                main_channel: "C014J93U4JZ",
                additional_channels: ["C0155MGT7NW", "C015BSR32E8", "C0155TL4KKM", "C0155MHAHB4", "C014QV0F9AB", "C014YVDDLTG"],
                alert_type: "alert-single-channel",
                agenda_string: "",
                extra: "N/A",
            });
        });
        it("parse description, agenda items", async function () {
            const description = `{
                "event_type": "meeting",
                "alert_type": "alert-single-channel",
                "main_channel": "C014J93U4JZ",
                "additional_channels": "default",
                "agenda": [
                    "item", "item1", "item2"
                ],
                "extra": "N/A"
            }`;
            assert.deepEqual(await calendar_handler.getParametersFromDescription("Meeting", description, slack_handler.defaultChannels), {
                event_type: "meeting",
                main_channel: "C014J93U4JZ",
                additional_channels: ["C0155MGT7NW", "C015BSR32E8", "C0155TL4KKM", "C0155MHAHB4", "C014QV0F9AB", "C014YVDDLTG"],
                alert_type: "alert-single-channel",
                agenda_string: "\n    • item\n    • item1\n    • item2",
                extra: "N/A",
            });
        });
        it("parse description, agenda items, non default channels no translation", async function () {
            const description = `{
                    "event_type": "test",
                    "alert_type": "alert-main-channel",
                    "main_channel": "C014J93U4JZ",
                    "additional_channels": [
                        "C014J93U4JA", "C0155MHAHB4"
                    ],
                    "agenda": [
                        "item", "item1", "item2"
                    ],
                    "extra": "N/A"
                }`;

            assert.deepEqual(await calendar_handler.getParametersFromDescription("Meeting", description, slack_handler.defaultChannels), {
                event_type: "test",
                main_channel: "C014J93U4JZ",
                additional_channels: ["C014J93U4JA", "C0155MHAHB4"],
                alert_type: "alert-main-channel",
                agenda_string: "\n    • item\n    • item1\n    • item2",
                extra: "N/A",
            });
        });
        it("parse description, agenda items, non default channels translation", async function () {
            const description = `{
                "event_type": "test",
                "alert_type": "alert-single-channel",
                "main_channel": "C014J93U4JZ",
                "additional_channels": [
                    "C014J93U4JZ", "C0155MHAHB4"
                ],
                "agenda": [
                    "item", "item1", "item2"
                ],
                "extra": "N/A"
            }`;
            assert.deepEqual(await calendar_handler.getParametersFromDescription("Meeting", description, slack_handler.defaultChannels), {
                event_type: "test",
                main_channel: "C014J93U4JZ",
                additional_channels: ["C0155MHAHB4"],
                alert_type: "alert-single-channel",
                agenda_string: "\n    • item\n    • item1\n    • item2",
                extra: "N/A",
            });
        });
    });
});
