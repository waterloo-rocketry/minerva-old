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

describe("handlers/calendar-handler.js tests", function () {
    describe("parseDescription", function () {
        const channelIDMapping = new Map();
        channelIDMapping.set("general", "C014J93U4JZ");
        channelIDMapping.set("propulsion", "C0155MHAHB4");
        it("parse description, no agenda items", async function () {
            const description = `{
                    "eventType": "meeting",
                    "alertType": "alert-single-channel",
                    "mainChannel": "C014J93U4JZ",
                    "additionalChannels": "default",
                    "agenda": "",
                    "extra": "N/A"
                }`;

            assert.deepStrictEqual(await calendar_handler.getParametersFromDescription("Meeting", description, slack_handler.defaultChannels), {
                eventType: "meeting",
                mainChannel: "C014J93U4JZ",
                additionalChannels: ["C0155MGT7NW", "C015BSR32E8", "C0155TL4KKM", "C0155MHAHB4", "C014QV0F9AB", "C014YVDDLTG"],
                alertType: "alert-single-channel",
                agenda: "",
                extra: "N/A",
                location: "E5 2001",
                link: "https://meet.jit.si/bay_area",
            });
        });
        it("parse description, agenda items", async function () {
            const description = `{
                "eventType": "meeting",
                "alertType": "alert-single-channel",
                "mainChannel": "C014J93U4JZ",
                "additionalChannels": "default",
                "agenda": [
                    "item", "item1", "item2"
                ],
                "extra": "N/A"
            }`;
            assert.deepStrictEqual(await calendar_handler.getParametersFromDescription("Meeting", description, slack_handler.defaultChannels), {
                eventType: "meeting",
                mainChannel: "C014J93U4JZ",
                additionalChannels: ["C0155MGT7NW", "C015BSR32E8", "C0155TL4KKM", "C0155MHAHB4", "C014QV0F9AB", "C014YVDDLTG"],
                alertType: "alert-single-channel",
                agenda: ["item", "item1", "item2"],
                location: "E5 2001",
                extra: "N/A",
                link: "https://meet.jit.si/bay_area",
            });
        });
        it("parse description, agenda items, non default channels no translation", async function () {
            const description = `{
                    "eventType": "test",
                    "alertType": "alert-main-channel",
                    "mainChannel": "C014J93U4JZ",
                    "additionalChannels": [
                        "C014J93U4JA", "C0155MHAHB4"
                    ],
                    "agenda": [
                        "item", "item1", "item2"
                    ],
                    "extra": "N/A"
                }`;

            assert.deepStrictEqual(await calendar_handler.getParametersFromDescription("Meeting", description, slack_handler.defaultChannels), {
                eventType: "test",
                mainChannel: "C014J93U4JZ",
                additionalChannels: ["C014J93U4JA", "C0155MHAHB4"],
                alertType: "alert-main-channel",
                agenda: ["item", "item1", "item2"],
                location: "E5 2001",
                extra: "N/A",
                link: "https://meet.jit.si/bay_area",
            });
        });
        it("parse description, agenda items, non default channels translation", async function () {
            const description = `{
                "eventType": "test",
                "alertType": "alert-single-channel",
                "mainChannel": "C014J93U4JZ",
                "additionalChannels": [
                    "C014J93U4JZ", "C0155MHAHB4"
                ],
                "agenda": [
                    "item", "item1", "item2"
                ],
                "extra": "N/A"
            }`;
            assert.deepStrictEqual(await calendar_handler.getParametersFromDescription("Meeting", description, slack_handler.defaultChannels), {
                eventType: "test",
                mainChannel: "C014J93U4JZ",
                additionalChannels: ["C0155MHAHB4"],
                alertType: "alert-single-channel",
                agenda: ["item", "item1", "item2"],
                location: "E5 2001",
                extra: "N/A",
                link: "https://meet.jit.si/bay_area",
            });
        });
        it("parse description, agenda items, custom link", async function () {
            const description = `{
                "eventType": "test",
                "alertType": "alert-single-channel",
                "mainChannel": "C014J93U4JZ",
                "additionalChannels": [
                    "C014J93U4JZ", "C0155MHAHB4"
                ],
                "agenda": [
                    "item", "item1", "item2"
                ],
                "extra": "N/A",
                "link": "https://meet.jit.si/not_bay_area"
            }`;
            assert.deepStrictEqual(await calendar_handler.getParametersFromDescription("Meeting", description, slack_handler.defaultChannels), {
                eventType: "test",
                mainChannel: "C014J93U4JZ",
                additionalChannels: ["C0155MHAHB4"],
                alertType: "alert-single-channel",
                location: "E5 2001",
                agenda: ["item", "item1", "item2"],
                extra: "N/A",
                link: "https://meet.jit.si/not_bay_area",
            });
        });
    });
});
