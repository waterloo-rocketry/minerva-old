// const test = require("firebase-functions-test")();
const assert = require("assert");
const chai = require("chai");
chai.use(require("chai-as-promised"));
const expect = require("chai").expect;

// Although we will not be using any API features, without mocking these values they become undefined and the tests fail
// test.mockConfig({
//     slack: {
//         token: "",
//     },
//     googleaccount: {
//         client: "",
//         secret: "",
//         redirect: "",
//     },
// });

const notify = require("../../src/commands/notify");

describe("commands/notify.js tests", function () {
    describe("parseNotifyBlock", function () {
        it("non-null meeting block items", async function () {
            assert.deepStrictEqual(await notify.parseNotifyBlock("C014J93U4JZ"), require("./notifyBlocks/parsedNotifyBlock.json"));
        });
    });

    describe("extractNotifyParameters", function () {
        it("missing or incorrect link", async function () {
            await expect(notify.extractNotifyParameters(require("./notifyBlocks/noMessageBlockResult.json"))).to.be.rejectedWith(
                "The 'message link' input box must be a link to a waterloo rocketry message"
            );
        });
        it("no alert type", async function () {
            await expect(notify.extractNotifyParameters(require("./notifyBlocks/noAlertBlockResult.json"))).to.be.rejectedWith("You must select an alert type");
        });
        it("no channels", async function () {
            await expect(notify.extractNotifyParameters(require("./notifyBlocks/noChannelsBlockResult.json"))).to.be.rejectedWith(
                "You must select at least one additional channel, not including the messages original channel"
            );
        });
        it("good notify block", async function () {
            assert.deepStrictEqual(await notify.extractNotifyParameters(require("./notifyBlocks/goodNotifyResult.json")), {
                link: "https://waterloorocketry.slack.com/archives/C07MXA613/p1605073692312300",
                alertType: "alert",
                channels: ["C01535M46SC", "C8VL7QCG0", "CCWGTJH7F", "C4H4NJG77", "C07MWEYPR", "C07MX0QDS", "C90E34QDD", "CV7S1E49Y", "C07MX5JDB"],
            });
        });
    });
});
