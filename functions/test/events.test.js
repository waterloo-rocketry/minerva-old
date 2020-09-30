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

const ONE_MINUTE = 60000;
const FIVE_MINUTES = 300000; // 5 minutes in milliseconds
const SIX_HOURS = 21600000; // 6 hours in milliseconds

describe("scheduled/event.js tests", function () {
    describe("isEventSoon", function () {
        it("check event already happened", async function () {
            await expect(event.isEventSoon(-1)).to.be.rejectedWith("no-send");
        });
        it("check event 2 minutes away", async function () {
            await expect(event.isEventSoon(ONE_MINUTE * 2)).to.be.rejectedWith("no-send");
        });
        it("check event just below 5 minutes away", async function () {
            assert.equal(await event.isEventSoon(FIVE_MINUTES - 50000), true);
        });
        it("check event just above 5 minutes away", async function () {
            assert.equal(await event.isEventSoon(FIVE_MINUTES + 50000), true);
        });
        it("check event somewhere between bounds", async function () {
            await expect(event.isEventSoon(FIVE_MINUTES + ONE_MINUTE + 1)).to.be.rejectedWith("no-send");
            await expect(event.isEventSoon(SIX_HOURS - ONE_MINUTE - 1)).to.be.rejectedWith("no-send");
        });
        it("check event within upper bounds", async function () {
            assert.equal(await event.isEventSoon(SIX_HOURS), false);
            assert.equal(await event.isEventSoon(SIX_HOURS - 1), false);
            assert.equal(await event.isEventSoon(SIX_HOURS + 1), false);
        });
        it("check event above upper bounds", async function () {
            await expect(event.isEventSoon(SIX_HOURS + FIVE_MINUTES + 1)).to.be.rejectedWith("no-send");
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

            assert.deepStrictEqual(
                await event.generateMessage(
                    testEvent,
                    {
                        eventType: "meeting",
                        mainChannel: "C014J93U4JZ",
                        additionalChannels: ["C0155MHAHB4"],
                        alertType: "alert-single-channel",
                        agenda: ["item", "item1", "item2"],
                        extra: "N/A",
                        link: "https://meet.jit.si/bay_area",
                    },
                    FIVE_MINUTES - 1,
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

            assert.deepStrictEqual(
                await event.generateMessage(
                    testEvent,
                    {
                        eventType: "meeting",
                        mainChannel: "C014J93U4JZ",
                        additionalChannels: ["C0155MHAHB4"],
                        alertType: "alert",
                        agenda: ["item", "item1", "item2"],
                        extra: "N/A",
                        link: "https://meet.jit.si/bay_area",
                    },
                    SIX_HOURS - 1,
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

            assert.deepStrictEqual(
                await event.generateMessage(
                    testEvent,
                    {
                        eventType: "meeting",
                        mainChannel: "C014J93U4JZ",
                        additionalChannels: ["C0155MHAHB4"],
                        alertType: "alert",
                        agenda: "",
                        extra: "N/A",
                        link: "https://meet.jit.si/bay_area",
                    },
                    SIX_HOURS - 1,
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

            assert.deepStrictEqual(
                await event.generateMessage(
                    testEvent,
                    {
                        eventType: "meeting",
                        mainChannel: "C014J93U4JZ",
                        additionalChannels: ["C0155MHAHB4"],
                        alertType: "alert-main-channel",
                        agenda: ["item", "item1", "item2"],
                        extra: "N/A",
                        link: "https://meet.jit.si/bay_area",
                    },
                    FIVE_MINUTES - 1,
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

            assert.deepStrictEqual(
                await event.generateMessage(
                    testEvent,
                    {
                        eventType: "meeting",
                        mainChannel: "C014J93U4JZ",
                        additionalChannels: ["C0155MHAHB4"],
                        alertType: "alert-single-channel",
                        agenda: ["item", "item1", "item2"],
                        extra: "N/A",
                        link: "https://meet.jit.si/bay_area",
                    },
                    FIVE_MINUTES - 1,
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

            assert.deepStrictEqual(
                await event.generateMessage(
                    testEvent,
                    {
                        eventType: "meeting",
                        mainChannel: "C014J93U4JZ",
                        additionalChannels: ["C0155MHAHB4"],
                        alertType: "alert-single-channel",
                        agenda: ["item", "item1", "item2"],
                        extra: "N/A",
                        link: "https://meet.jit.si/not_bay_area",
                    },
                    FIVE_MINUTES - 1,
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

            assert.deepStrictEqual(
                await event.generateMessage(
                    testEvent,
                    {
                        eventType: "test",
                        mainChannel: "C014J93U4JZ",
                        additionalChannels: ["C0155MHAHB4"],
                        alertType: "alert",
                        agenda: ["item", "item1", "item2"],
                        extra: "N/A",
                        link: "https://meet.jit.si/bay_area",
                    },
                    FIVE_MINUTES - 1,
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

            assert.deepStrictEqual(
                await event.generateMessage(
                    testEvent,
                    {
                        eventType: "other",
                        mainChannel: "C014J93U4JZ",
                        additionalChannels: ["C0155MHAHB4"],
                        alertType: "alert",
                        agenda: ["item", "item1", "item2"],
                        extra: "N/A",
                        link: "https://meet.jit.si/bay_area",
                    },
                    SIX_HOURS - 1,
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

            assert.deepStrictEqual(
                await event.generateMessage(
                    testEvent,
                    {
                        eventType: "meeting",
                        mainChannel: "C014J93U4JZ",
                        additionalChannels: ["C0155MHAHB4"],
                        alertType: "alert-single-channel",
                        agenda: ["item", "item1", "item2"],
                        extra: "N/A",
                        link: "https://meet.jit.si/bay_area",
                    },
                    FIVE_MINUTES - 1,
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

            assert.deepStrictEqual(await event.generateEmojiPair(), ["white_check_mark", "x"]);
        });
        it("pass duplicate emojis then unique emojis", async function () {
            let callCount = 0;
            require("../handlers/slack-handler").getRandomEmoji = function () {
                callCount++;
                return callCount <= 5 ? "watermelon" : "melon"; // returns :watermelon: for comingEmoji + first 4 attempts to get notComingEmoji
            };

            assert.deepStrictEqual(await event.generateEmojiPair(), ["watermelon", "melon"]);
        });
        it("pass unique emojis", async function () {
            let alternateEmoji = false;
            require("../handlers/slack-handler").getRandomEmoji = function () {
                alternateEmoji = !alternateEmoji;
                return alternateEmoji ? "watermelon" : "melon"; // Alternates between returning two emojis
            };

            assert.deepStrictEqual(await event.generateEmojiPair(), ["watermelon", "melon"]);
        });
    });
});
