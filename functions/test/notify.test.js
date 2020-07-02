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

const notify = require("../commands/notify");
require("../handlers/slack-handler").defaultChannels = ["C0155MGT7NW", "C015BSR32E8", "C014J93U4JZ", "C0155TL4KKM", "C0155MHAHB4", "C014QV0F9AB", "C014YVDDLTG"]; // development workspace

describe("commands/notify.js tests", function () {
    describe("filterParameters", async function () {
        it("missing link to text", async function () {
            await expect(notify.filterParameters("", "<#C014J93U4JZ>")).to.be.rejectedWith(
                "Incorrect usage: /notify <link-to-message> <copy/alert/alert-single-channel> [#channel1, #channel2, ...]"
            );
        });
        it("incorrect link to text", async function () {
            await expect(notify.filterParameters("<https://test.slack.com/", "C014J93U4JZ")).to.be.rejectedWith(
                "Parameter 1 must be a link to a waterloo rocketry message"
            );
        });
        it("incorrect alert type", async function () {
            await expect(notify.filterParameters("<https://waterloorocketry.slack.com/ none", "C014J93U4JZ")).to.be.rejectedWith(
                "Parameter 2 must be either `copy/alert/alert-single-channel`"
            );
        });
        it("alert-single-channel default channels", async function () {
            assert.deepEqual(await notify.filterParameters("<https://waterloorocketry.slack.com/test> alert-single-channel", "C014J93U4JZ"), {
                link: "https://waterloorocketry.slack.com/test",
                alert_type: "alert-single-channel",
                channels: ["C0155MGT7NW", "C015BSR32E8", "C0155TL4KKM", "C0155MHAHB4", "C014QV0F9AB", "C014YVDDLTG"],
            });
        });
        it("alerting too many channels", async function () {
            await expect(notify.filterParameters("<https://waterloorocketry.slack.com/test> alert", "C014J93U4JZ")).to.be.rejectedWith(
                "Sorry, you cannot use `alert` when selecting more than 5 channels."
            );
        });
        it("copy default channels", async function () {
            assert.deepEqual(await notify.filterParameters("<https://waterloorocketry.slack.com/test> copy <#C014J93U4JZ", "C014YVDDLTG"), {
                link: "https://waterloorocketry.slack.com/test",
                alert_type: "copy",
                channels: ["C014J93U4JZ"],
            });
        });
        it("alert one channel", async function () {
            assert.deepEqual(await notify.filterParameters("<https://waterloorocketry.slack.com/test> alert <#C014J93U4JZ", "C014YVDDLTG"), {
                link: "https://waterloorocketry.slack.com/test",
                alert_type: "alert",
                channels: ["C014J93U4JZ"],
            });
        });
    });
});
