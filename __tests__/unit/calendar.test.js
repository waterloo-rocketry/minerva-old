const assert = require("assert");
const chai = require("chai");
chai.use(require("chai-as-promised"));
const expect = require("chai").expect;

const calendar_handler = require("../../src/handlers/calendar-handler");
const slack_handler = require("../../src/handlers/slack-handler.js");
slack_handler.defaultChannels = ["C0155MGT7NW", "C015BSR32E8", "C014J93U4JZ", "C0155TL4KKM", "C0155MHAHB4", "C014QV0F9AB", "C014YVDDLTG"]; // development workspace

const LOWER_BOUND = 300000; // 5 minutes in milliseconds
const UPPER_BOUND = 21600000; // 6 hours in milliseconds

const channelNameIdMapping = new Map();
channelNameIdMapping.set("general", "C014J93U4JZ");
channelNameIdMapping.set("propulsion", "C0155MHAHB4");
channelNameIdMapping.set("random", "C014KSDM37V");

const channelIdNameMapping = new Map();
channelIdNameMapping.set("C014J93U4JZ", "general");
channelIdNameMapping.set("C0155MHAHB4", "propulsion");
channelIdNameMapping.set("C014KSDM37V", "random");

slack_handler.generateChannelNameIdMapping = function () {
    return channelNameIdMapping;
};

slack_handler.generateChannelIdNameMapping = function () {
    return channelIdNameMapping;
};

describe("handlers/calendar-handler.js tests", function () {
    describe("parseDescription", function () {
        it("parse description, no agenda items", async function () {
            const description = `{
                    "eventType": "meeting",
                    "alertType": "alert-single-channel",
                    "mainChannel": "general",
                    "additionalChannels": [],
                    "agendaItems": "",
                    "notes": "N/A"
                }`;

            assert.deepStrictEqual(
                await calendar_handler.getParametersFromDescription(
                    {
                        summary: "Meeting",
                        description: description,
                    },
                    slack_handler.defaultChannels
                ),
                {
                    eventType: "meeting",
                    mainChannel: "C014J93U4JZ",
                    additionalChannels: [],
                    alertType: "alert-single-channel",
                    agendaItems: [],
                    notes: "N/A",
                    location: "",
                    link: "https://meet.jit.si/bay_area",
                }
            );
        });
        it("parse description, agenda items", async function () {
            const description = `{
                "eventType": "meeting",
                "alertType": "alert-single-channel",
                "mainChannel": "general",
                "additionalChannels": [],
                "agendaItems": [
                    "item", "item1", "item2"
                ],
                "notes": "N/A"
            }`;
            assert.deepStrictEqual(
                await calendar_handler.getParametersFromDescription(
                    {
                        summary: "Meeting",
                        description: description,
                    },
                    slack_handler.defaultChannels
                ),
                {
                    eventType: "meeting",
                    mainChannel: "C014J93U4JZ",
                    additionalChannels: [],
                    alertType: "alert-single-channel",
                    agendaItems: ["item", "item1", "item2"],
                    location: "",
                    notes: "N/A",
                    link: "https://meet.jit.si/bay_area",
                }
            );
        });
        it("parse description, agenda items, non default channels no translation", async function () {
            const description = `{
                    "eventType": "test",
                    "alertType": "alert-main-channel",
                    "mainChannel": "general",
                    "additionalChannels": [
                        "random", "propulsion"
                    ],
                    "agendaItems": [
                        "item", "item1", "item2"
                    ],
                    "notes": "N/A"
                }`;

            assert.deepStrictEqual(
                await calendar_handler.getParametersFromDescription(
                    {
                        summary: "Meeting",
                        description: description,
                    },
                    slack_handler.defaultChannels
                ),
                {
                    eventType: "test",
                    mainChannel: "C014J93U4JZ",
                    additionalChannels: ["C014KSDM37V", "C0155MHAHB4"],
                    alertType: "alert-main-channel",
                    agendaItems: ["item", "item1", "item2"],
                    location: "",
                    notes: "N/A",
                    link: "https://meet.jit.si/bay_area",
                }
            );
        });
        it("parse description, agenda items, non default channels translation", async function () {
            const description = `{
                "eventType": "test",
                "alertType": "alert-single-channel",
                "mainChannel": "general",
                "additionalChannels": [
                    "general", "propulsion"
                ],
                "agendaItems": [
                    "item", "item1", "item2"
                ],
                "notes": "N/A"
            }`;
            assert.deepStrictEqual(
                await calendar_handler.getParametersFromDescription(
                    {
                        summary: "Meeting",
                        description: description,
                    },
                    slack_handler.defaultChannels
                ),
                {
                    eventType: "test",
                    mainChannel: "C014J93U4JZ",
                    additionalChannels: ["C0155MHAHB4"],
                    alertType: "alert-single-channel",
                    agendaItems: ["item", "item1", "item2"],
                    location: "",
                    notes: "N/A",
                    link: "https://meet.jit.si/bay_area",
                }
            );
        });
        it("parse description, agenda items, custom link, location specified", async function () {
            const description = `{
                "eventType": "test",
                "alertType": "alert-single-channel",
                "mainChannel": "general",
                "additionalChannels": [
                    "general", "propulsion"
                ],
                "agendaItems": [
                    "item", "item1", "item2"
                ],
                "notes": "N/A",
                "link": "https://meet.jit.si/not_bay_area"
            }`;
            assert.deepStrictEqual(
                await calendar_handler.getParametersFromDescription(
                    {
                        summary: "Meeting",
                        description: description,
                        location: "E5 2001",
                    },
                    slack_handler.defaultChannels
                ),
                {
                    eventType: "test",
                    mainChannel: "C014J93U4JZ",
                    additionalChannels: ["C0155MHAHB4"],
                    alertType: "alert-single-channel",
                    location: "E5 2001",
                    agendaItems: ["item", "item1", "item2"],
                    notes: "N/A",
                    link: "https://meet.jit.si/not_bay_area",
                }
            );
        });


        //NEW //
        it("parse description, agenda items, custom link, location specified", async function () {
            const description = `{
                "eventType": "test",
                "alertType": "alert-single-channel",
                "mainChannel": "general",
                "additionalChannels": [
                    "general", "software"
                ],
                "agendaItems": [
                    "item", "item1", "item2"
                ],
                "notes": "N/A",
                "link": "https://meet.jit.si/not_bay_area"
            }`;
            assert.deepStrictEqual(
                await calendar_handler.getParametersFromDescription(
                    {
                        summary: "Cancelled Meeting",
                        description: description,
                        location: "E5 2001",
                    },
                    slack_handler.defaultChannels
                ),
                {
                    eventType: "test",
                    mainChannel: "C014J93U4JZ",
                    additionalChannels: ["C0155MHAHB4"],
                    alertType: "alert-single-channel",
                    location: "E5 2001",
                    agendaItems: ["item", "item1", "item2"],
                    notes: "N/A",
                    link: "https://meet.jit.si/not_bay_area",
                }
            );
        });


    });
});
