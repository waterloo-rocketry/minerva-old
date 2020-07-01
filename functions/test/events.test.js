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
    calendar: {
        client: "",
        secret: "",
        redirect: "",
    },
});

const event = require("../scheduled/events");
const LOWER_BOUND = 300000; // 5 minutes in milliseconds
const UPPER_BOUND = 21600000; // 6 hours in milliseconds

describe("scheduled/event.js tests", function () {
    describe("isEventSoon", function () {
        it("check event below lower bounds", async function () {
            await expect(event.isEventSoon(-1)).to.be.rejectedWith("no-send");
        });
        it("check event within lower bounds", async function () {
            assert.equal(await event.isEventSoon(LOWER_BOUND - 1), true);
            assert.equal(await event.isEventSoon(1), true);
        });
        it("check event between bounds", async function () {
            await expect(event.isEventSoon(LOWER_BOUND + 1)).to.be.rejectedWith("no-send");
            await expect(event.isEventSoon(UPPER_BOUND - LOWER_BOUND - 1)).to.be.rejectedWith("no-send");
        });
        it("check event within upper bounds", async function () {
            assert.equal(await event.isEventSoon(UPPER_BOUND), false);
            assert.equal(await event.isEventSoon(UPPER_BOUND + LOWER_BOUND - 1), false);
            assert.equal(await event.isEventSoon(UPPER_BOUND - LOWER_BOUND + 1), false);
        });
        it("check event above upper bounds", async function () {
            await expect(event.isEventSoon(UPPER_BOUND + LOWER_BOUND + 1)).to.be.rejectedWith("no-send");
        });
    });

    describe("parseDescription", function () {
        const channelIDMapping = new Map();
        channelIDMapping.set("general", "C014J93U4JZ");
        channelIDMapping.set("propulsion", "C0155MHAHB4");
        it("parse description, no agenda items", async function () {
            // prettier-ignore
            const description = "meeting"
                + "\nalert-single-channel"
                + "\n#general"
                + "\ndefault"
                + "\n"
                + "\nN/A";

            assert.deepEqual(await event.parseDescription("Meeting", description, channelIDMapping), {
                type: "meeting",
                main_channel: "C014J93U4JZ",
                additional_channels: ["C0155MGT7NW", "C015BSR32E8", "C0155TL4KKM", "C0155MHAHB4", "C014QV0F9AB", "C014YVDDLTG"],
                alert_type: "alert-single-channel",
                agenda: "",
                extra: "N/A",
            });
        });
        it("parse description, agenda items", async function () {
            // prettier-ignore
            const description =
                "meeting"
                + "\nalert-single-channel"
                + "\n#general"
                + "\ndefault"
                + "\nitem,item1,item2"
                + "\nN/A";
            assert.deepEqual(await event.parseDescription("Meeting", description, channelIDMapping), {
                type: "meeting",
                main_channel: "C014J93U4JZ",
                additional_channels: ["C0155MGT7NW", "C015BSR32E8", "C0155TL4KKM", "C0155MHAHB4", "C014QV0F9AB", "C014YVDDLTG"],
                alert_type: "alert-single-channel",
                agenda: "\n    • item\n    • item1\n    • item2",
                extra: "N/A",
            });
        });
        it("parse description, agenda items, non default channels no translation", async function () {
            // prettier-ignore
            const description =
                "test"
                + "\nalert-main-channel"
                + "\n#general"
                + "\n#test #rest #lest"
                + "\nitem,item1,item2"
                + "\nN/A";

            assert.deepEqual(await event.parseDescription("Meeting", description, channelIDMapping), {
                type: "test",
                main_channel: "general",
                additional_channels: ["test", "rest", "lest"],
                alert_type: "alert-main-channel",
                agenda: "\n    • item\n    • item1\n    • item2",
                extra: "N/A",
            });
        });
        it("parse description, agenda items, non default channels translation", async function () {
            // prettier-ignore
            const description =
                "test"
                + "\nalert-single-channel"
                + "\n#general"
                + "\n#general #propulsion"
                + "\nitem,item1,item2"
                + "\nN/A";

            assert.deepEqual(await event.parseDescription("Meeting", description, channelIDMapping), {
                type: "test",
                main_channel: "C014J93U4JZ",
                additional_channels: ["C0155MHAHB4"],
                alert_type: "alert-single-channel",
                agenda: "\n    • item\n    • item1\n    • item2",
                extra: "N/A",
            });
        });
    });

    describe("generateMessage", function () {
        const testEvent = {
            summary: "Test Event",
            location: "The Bay",
        };

        // replace getRandomEmoji with function with repeatable outcome
        require("../handlers/slack-handler").getRandomEmoji = function () {
            return ":watermelon:";
        };

        it("check close message", async function () {
            // prettier-ignore
            const expectedMessage =
                "<!channel>"
                + "\nReminder: *Test Event* is occurring in *5 minutes*"
                + "\nPlease see the agenda items:"
                + "\n    • item"
                + "\n    • item1"
                + "\n    • item2"
                + "\nNotes: N/A"
                + "\nWays to attend:"
                + "\n      :office: In person @ The Bay"
                + "\n      :globe_with_meridians: Online @ https://meet.jit.si/bay_area"
                + "\n      :calling: By phone +1-437-538-3987 (2633 1815 39)";

            assert.deepEqual(
                await event.generateMessage(
                    testEvent,
                    {
                        type: "meeting",
                        main_channel: "C014J93U4JZ",
                        additional_channels: ["C0155MHAHB4"],
                        alert_type: "alert-single-channel",
                        agenda: "\n    • item\n    • item1\n    • item2",
                        extra: "N/A",
                    },
                    LOWER_BOUND - 1,
                    true,
                    new Date(1592900639642)
                ),
                expectedMessage
            );
        });
        it("check far message", async function () {
            // prettier-ignore
            const expectedMessage =
                "<!channel>"
                + "\nReminder: *Test Event* is occurring on *6/23/2020 at 4:23:59 AM*"
                + "\nPlease see the agenda items:"
                + "\n    • item"
                + "\n    • item1"
                + "\n    • item2"
                + "\nNotes: N/A"
                + "\nReact with :watermelon: if you're coming!";

            assert.deepEqual(
                await event.generateMessage(
                    testEvent,
                    {
                        type: "meeting",
                        main_channel: "C014J93U4JZ",
                        additional_channels: ["C0155MHAHB4"],
                        alert_type: "alert",
                        agenda: "\n    • item\n    • item1\n    • item2",
                        extra: "N/A",
                    },
                    LOWER_BOUND - 1,
                    false,
                    new Date(1592900639642)
                ),
                expectedMessage
            );
        });
        it("check no agenda items", async function () {
            // prettier-ignore
            const expectedMessage =
                "<!channel>"
                + "\nReminder: *Test Event* is occurring on *6/23/2020 at 4:23:59 AM*"
                + "\nThere are currently no agenda items listed for this meeting."
                + "\nNotes: N/A"
                + "\nReact with :watermelon: if you're coming!"

            assert.deepEqual(
                await event.generateMessage(
                    testEvent,
                    {
                        type: "meeting",
                        main_channel: "C014J93U4JZ",
                        additional_channels: ["C0155MHAHB4"],
                        alert_type: "alert",
                        agenda: "",
                        extra: "N/A",
                    },
                    LOWER_BOUND - 1,
                    false,
                    new Date(1592900639642)
                ),
                expectedMessage
            );
        });
        it("check copy message", async function () {
            // prettier-ignore
            const expectedMessage =
                "Reminder: *Test Event* is occurring in *5 minutes*"
                + "\nPlease see the agenda items:"
                + "\n    • item"
                + "\n    • item1"
                + "\n    • item2"
                + "\nNotes: N/A"
                + "\nWays to attend:"
                + "\n      :office: In person @ The Bay"
                + "\n      :globe_with_meridians: Online @ https://meet.jit.si/bay_area"
                + "\n      :calling: By phone +1-437-538-3987 (2633 1815 39)";

            assert.deepEqual(
                await event.generateMessage(
                    testEvent,
                    {
                        type: "meeting",
                        main_channel: "C014J93U4JZ",
                        additional_channels: ["C0155MHAHB4"],
                        alert_type: "alert-main-channel",
                        agenda: "\n    • item\n    • item1\n    • item2",
                        extra: "N/A",
                    },
                    LOWER_BOUND - 1,
                    true,
                    new Date(1592900639642)
                ),
                expectedMessage
            );
        });
        it("check meeting message", async function () {
            // prettier-ignore
            const expectedMessage =
                "<!channel>"
                + "\nReminder: *Test Event* is occurring in *5 minutes*"
                + "\nPlease see the agenda items:"
                + "\n    • item"
                + "\n    • item1"
                + "\n    • item2"
                + "\nNotes: N/A"
                + "\nWays to attend:"
                + "\n      :office: In person @ The Bay"
                + "\n      :globe_with_meridians: Online @ https://meet.jit.si/bay_area"
                + "\n      :calling: By phone +1-437-538-3987 (2633 1815 39)";

            assert.deepEqual(
                await event.generateMessage(
                    testEvent,
                    {
                        type: "meeting",
                        main_channel: "C014J93U4JZ",
                        additional_channels: ["C0155MHAHB4"],
                        alert_type: "alert-single-channel",
                        agenda: "\n    • item\n    • item1\n    • item2",
                        extra: "N/A",
                    },
                    LOWER_BOUND - 1,
                    true,
                    new Date(1592900639642)
                ),
                expectedMessage
            );
        });
        it("check test message", async function () {
            // prettier-ignore
            const expectedMessage =
                "<!channel>"
                + "\nReminder: *Test Event* is occurring in *5 minutes*"
                + "\nToday's test is located at: The Bay"
                + "\nNotes: N/A"
                + "\nReact with :watermelon: if you're coming!";

            assert.deepEqual(
                await event.generateMessage(
                    testEvent,
                    {
                        type: "test",
                        main_channel: "C014J93U4JZ",
                        additional_channels: ["C0155MHAHB4"],
                        alert_type: "alert",
                        agenda: "\n    • item\n    • item1\n    • item2",
                        extra: "N/A",
                    },
                    LOWER_BOUND - 1,
                    true,
                    new Date(1592900639642)
                ),
                expectedMessage
            );
        });
        it("check other message", async function () {
            // prettier-ignore
            const expectedMessage =
                "<!channel>"
                + "\nReminder: *Test Event* is occurring on *6/23/2020 at 4:23:59 AM*"
                + "\nNotes: N/A"
                + "\nReact with :watermelon: if you're coming!";

            assert.deepEqual(
                await event.generateMessage(
                    testEvent,
                    {
                        type: "other",
                        main_channel: "C014J93U4JZ",
                        additional_channels: ["C0155MHAHB4"],
                        alert_type: "alert",
                        agenda: "\n    • item\n    • item1\n    • item2",
                        extra: "N/A",
                    },
                    LOWER_BOUND - 1,
                    false,
                    new Date(1592900639642)
                ),
                expectedMessage
            );
        });
    });
});
