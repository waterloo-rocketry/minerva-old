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

    describe("generateMessage", function () {
        const testEvent = {
            summary: "Test Event",
            location: "The Bay",
        };

        // replace getRandomEmoji with function with repeatable outcome
        let alternateEmoji = false;
        require("../handlers/slack-handler").getRandomEmoji = function () {
            alternateEmoji = !alternateEmoji;

            return alternateEmoji ? "watermelon" : "melon";
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
                        event_type: "meeting",
                        main_channel: "C014J93U4JZ",
                        additional_channels: ["C0155MHAHB4"],
                        alert_type: "alert-single-channel",
                        agenda: ["item", "item1", "item2"],
                        extra: "N/A",
                        link: "https://meet.jit.si/bay_area",
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
                + "\nReminder: *Test Event* is occurring on *June 23rd, 2020 at 4:23 AM*"
                + "\nPlease see the agenda items:"
                + "\n    • item"
                + "\n    • item1"
                + "\n    • item2"
                + "\nNotes: N/A"
                + "\nReact with :watermelon: if you're coming, or :melon: if you're not!";

            assert.deepEqual(
                await event.generateMessage(
                    testEvent,
                    {
                        event_type: "meeting",
                        main_channel: "C014J93U4JZ",
                        additional_channels: ["C0155MHAHB4"],
                        alert_type: "alert",
                        agenda: ["item", "item1", "item2"],
                        extra: "N/A",
                        link: "https://meet.jit.si/bay_area",
                    },
                    LOWER_BOUND - 1,
                    false,
                    new Date(1592900639642),
                    await event.generateEmojiPair()
                ),
                expectedMessage
            );
        });
        it("check no agenda items", async function () {
            // prettier-ignore
            const expectedMessage =
                "<!channel>"
                + "\nReminder: *Test Event* is occurring on *June 23rd, 2020 at 4:23 AM*"
                + "\nThere are currently no agenda items listed for this meeting."
                + "\nNotes: N/A"
                + "\nReact with :watermelon: if you're coming, or :melon: if you're not!";

            assert.deepEqual(
                await event.generateMessage(
                    testEvent,
                    {
                        event_type: "meeting",
                        main_channel: "C014J93U4JZ",
                        additional_channels: ["C0155MHAHB4"],
                        alert_type: "alert",
                        agenda: "",
                        extra: "N/A",
                        link: "https://meet.jit.si/bay_area",
                    },
                    LOWER_BOUND - 1,
                    false,
                    new Date(1592900639642),
                    await event.generateEmojiPair()
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
                        event_type: "meeting",
                        main_channel: "C014J93U4JZ",
                        additional_channels: ["C0155MHAHB4"],
                        alert_type: "alert-main-channel",
                        agenda: ["item", "item1", "item2"],
                        extra: "N/A",
                        link: "https://meet.jit.si/bay_area",
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
                        event_type: "meeting",
                        main_channel: "C014J93U4JZ",
                        additional_channels: ["C0155MHAHB4"],
                        alert_type: "alert-single-channel",
                        agenda: ["item", "item1", "item2"],
                        extra: "N/A",
                        link: "https://meet.jit.si/bay_area",
                    },
                    LOWER_BOUND - 1,
                    true,
                    new Date(1592900639642)
                ),
                expectedMessage
            );
        });
        it("check meeting message with custom link", async function () {
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
                + "\n      :globe_with_meridians: Online @ https://meet.jit.si/not_bay_area"
                + "\n      :calling: By phone +1-437-538-3987 (2633 1815 39)";

            assert.deepEqual(
                await event.generateMessage(
                    testEvent,
                    {
                        event_type: "meeting",
                        main_channel: "C014J93U4JZ",
                        additional_channels: ["C0155MHAHB4"],
                        alert_type: "alert-single-channel",
                        agenda: ["item", "item1", "item2"],
                        extra: "N/A",
                        link: "https://meet.jit.si/not_bay_area",
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
                + "\nReact with :watermelon: if you're coming, or :melon: if you're not!";

            assert.deepEqual(
                await event.generateMessage(
                    testEvent,
                    {
                        event_type: "test",
                        main_channel: "C014J93U4JZ",
                        additional_channels: ["C0155MHAHB4"],
                        alert_type: "alert",
                        agenda: ["item", "item1", "item2"],
                        extra: "N/A",
                        link: "https://meet.jit.si/bay_area",
                    },
                    LOWER_BOUND - 1,
                    true,
                    new Date(1592900639642),
                    await event.generateEmojiPair()
                ),
                expectedMessage
            );
        });
        it("check other message", async function () {
            // prettier-ignore
            const expectedMessage =
                "<!channel>"
                + "\nReminder: *Test Event* is occurring on *June 23rd, 2020 at 4:23 AM*"
                + "\nNotes: N/A"
                + "\nReact with :watermelon: if you're coming, or :melon: if you're not!";

            assert.deepEqual(
                await event.generateMessage(
                    testEvent,
                    {
                        event_type: "other",
                        main_channel: "C014J93U4JZ",
                        additional_channels: ["C0155MHAHB4"],
                        alert_type: "alert",
                        agenda: ["item", "item1", "item2"],
                        extra: "N/A",
                        link: "https://meet.jit.si/bay_area",
                    },
                    LOWER_BOUND - 1,
                    false,
                    new Date(1592900639642),
                    await event.generateEmojiPair()
                ),
                expectedMessage
            );
        });
        it("check no emojis required but passed", async function () {
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
                        event_type: "meeting",
                        main_channel: "C014J93U4JZ",
                        additional_channels: ["C0155MHAHB4"],
                        alert_type: "alert-single-channel",
                        agenda: ["item", "item1", "item2"],
                        extra: "N/A",
                        link: "https://meet.jit.si/bay_area",
                    },
                    LOWER_BOUND - 1,
                    true,
                    new Date(1592900639642),
                    event.generateEmojiPair()
                ),
                expectedMessage
            );
        });
    });
    describe("generateEmojiPair", function () {
        it("pass duplicate emojis", async function () {
            // Override to pass only one emoji
            require("../handlers/slack-handler").getRandomEmoji = function () {
                return "watermelon";
            };

            assert.deepEqual(await event.generateEmojiPair(), ["white_check_mark", "x"]);
        });
        it("pass duplicate emojis then unique emojis", async function () {
            let callCount = 0;
            require("../handlers/slack-handler").getRandomEmoji = function () {
                callCount++;
                return callCount <= 5 ? "watermelon" : "melon"; // returns :watermelon: for comingEmoji + first 4 attempts to get notComingEmoji
            };

            assert.deepEqual(await event.generateEmojiPair(), ["watermelon", "melon"]);
        });
        it("pass unique emojis", async function () {
            let alternateEmoji = false;
            require("../handlers/slack-handler").getRandomEmoji = function () {
                alternateEmoji = !alternateEmoji;
                return alternateEmoji ? "watermelon" : "melon"; // Alternates between returning two emojis
            };

            assert.deepEqual(await event.generateEmojiPair(), ["watermelon", "melon"]);
        });
    });
});
