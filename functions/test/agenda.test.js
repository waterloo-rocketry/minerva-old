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

const agenda = require("../commands/agenda");
require("../handlers/slack-handler").defaultChannels = ["C0155MGT7NW", "C015BSR32E8", "C014J93U4JZ", "C0155TL4KKM", "C0155MHAHB4", "C014QV0F9AB", "C014YVDDLTG"]; // development workspace

describe("commands/agenda.js tests", function () {
    describe("filterParameters", function () {
        it("no parameters", async function () {
            await expect(agenda.filterParameters("")).to.be.rejectedWith("Missing required parameter: `add/remove/list`");
        });
        it("incorrect parameter", async function () {
            await expect(agenda.filterParameters("test")).to.be.rejectedWith("Missing required parameter: `add/remove/list`");
        });
        it("list", async function () {
            assert.deepEqual(await agenda.filterParameters("list"), {
                modifier: "list",
                text: "",
            });
        });
        it("add", async function () {
            assert.deepEqual(await agenda.filterParameters("add test test test"), {
                modifier: "add",
                text: "test test test",
            });
        });
        it("remove", async function () {
            assert.deepEqual(await agenda.filterParameters("remove 2"), {
                modifier: "remove",
                text: "2",
            });
        });
        it("remove non-number", async function () {
            await expect(agenda.filterParameters("remove test")).to.be.rejectedWith("Second parameter of `remove` modifier must be a positive integer");
        });
        it("remove number less than 1", async function () {
            await expect(agenda.filterParameters("remove 0")).to.be.rejectedWith("Second parameter of `remove` modifier must be a positive integer");
        });
    });
    describe("generateListMessage", function () {
        it("no agenda items", async function () {
            // prettier-ignore
            const description = "meeting"
                + "\nalert-single-channel"
                + "\n#general"
                + "\ndefault"
                + "\n"
                + "\nN/A";
            const message = "There are currently no agenda items for the next meeting.";

            assert.deepEqual(await agenda.generateListMessage(description), message);
        });
        it("1 agenda item", async function () {
            // prettier-ignore
            const description = "meeting"
                + "\nalert-single-channel"
                + "\n#general"
                + "\ndefault"
                + "\ntest"
                + "\nN/A";
            // prettier-ignore
            const message = "Please see agenda items:"
                + "\n    1. test";

            assert.deepEqual(await agenda.generateListMessage(description), message);
        });
        it("2 agenda items", async function () {
            // prettier-ignore
            const description = "meeting"
                + "\nalert-single-channel"
                + "\n#general"
                + "\ndefault"
                + "\ntest, test2"
                + "\nN/A";
            // prettier-ignore
            const message = "Please see agenda items:"
                + "\n    1. test"
                + "\n    2. test2";

            assert.deepEqual(await agenda.generateListMessage(description), message);
        });
    });
    describe("addAgendaItemToDescription", function () {
        it("start no agenda items, add one", async function () {
            // prettier-ignore
            const description = "meeting"
                + "\nalert-single-channel"
                + "\n#general"
                + "\ndefault"
                + "\n"
                + "\nN/A";
            // prettier-ignore
            const expectedDescription = "meeting"
                + "\nalert-single-channel"
                + "\n#general"
                + "\ndefault"
                + "\nitem1"
                + "\nN/A";

            assert.deepEqual(await agenda.addAgendaItemToDescription(description, "item1"), expectedDescription);
        });
        it("start one agenda item, add one", async function () {
            // prettier-ignore
            const description = "meeting"
                + "\nalert-single-channel"
                + "\n#general"
                + "\ndefault"
                + "\ntest"
                + "\nN/A";
            // prettier-ignore
            const expectedDescription = "meeting"
                + "\nalert-single-channel"
                + "\n#general"
                + "\ndefault"
                + "\ntest,item1"
                + "\nN/A";

            assert.deepEqual(await agenda.addAgendaItemToDescription(description, "item1"), expectedDescription);
        });
    });
    describe("removeAgendaItemFromDescription", function () {
        it("remove agenda item", async function () {
            // prettier-ignore
            const description = "meeting"
                + "\nalert-single-channel"
                + "\n#general"
                + "\ndefault"
                + "\nitem1"
                + "\nN/A";
            // prettier-ignore
            const expectedDescription = "meeting"
                + "\nalert-single-channel"
                + "\n#general"
                + "\ndefault"
                + "\n"
                + "\nN/A";

            assert.deepEqual(await agenda.removeAgendaItemFromDescription(description, 1), expectedDescription);
        });
    });
});
