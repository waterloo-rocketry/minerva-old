const assert = require("assert");
const chai = require("chai");
chai.use(require("chai-as-promised"));
const expect = require("chai").expect;

const edit = require("../../src/commands/meeting/edit");

describe("commands/meeting/edit.js tests", function () {
    // One test for this should suffice, there is no logic, it's simply a method for changing a JSON object
    describe("parseMeetingBlock", function () {
        it("parse a meeting block", async function () {
            assert.deepStrictEqual(
                await edit.parseMeetingBlock(
                    {
                        id: "123456789",
                        summary: "F20 Weekly Meetings",
                        start: {
                            dateTime: new Date("November 06 2020 3:33 EST"),
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
                require("./meetingBlocks/parsedMeetingBlock.json")
            );
        });
    });

    describe("extractMeetingParameters", function () {
        it("check null meeting block items", async function () {
            assert.deepStrictEqual(
                await edit.extractMeetingParameters(require("./meetingBlocks/emptyMeetingResult.json"), {
                    event_id: "123456789",
                    channel: "C014J93U4JZ",
                    subject: "S20 Weekly Meetings",
                    type: "meeting_update",
                }),
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
                await edit.extractMeetingParameters(require("./meetingBlocks/nonEmptyMeetingResult.json"), {
                    event_id: "123456789",
                    channel: "C014J93U4JZ",
                    subject: "S20 Weekly Meetings",
                    type: "meeting_update",
                }),
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
