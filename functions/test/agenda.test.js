const test = require('firebase-functions-test')();
const assert = require('assert');
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = require('chai').expect;

// Although we will not be using any API features, without mocking these values they become undefined and the tests fail
test.mockConfig({
    slack: {
        token: ''
    },
    calendar: {
        client: '',
        secret: '',
        redirect: ''
    }
});

const agenda = require('../commands/agenda');

describe('commands/agenda.js tests', function () {
    describe('filterParameters', function () {
        it('no parameters', async function () {
            await expect(agenda.filterParameters("")).to.be.rejectedWith("Missing required parameter: `add/remove/list`");
        });
        it('incorrect parameter', async function () {
            await expect(agenda.filterParameters("test")).to.be.rejectedWith("Missing required parameter: `add/remove/list`");
        });
        it('list', async function () {
            assert.deepEqual(await agenda.filterParameters("list"),
                {
                    modifier: "list",
                    text: ""
                }
            );
        });
        it('add', async function () {
            assert.deepEqual(await agenda.filterParameters("add test test test"),
                {
                    modifier: "add",
                    text: "test test test"
                }
            );
        });
        it('remove', async function () {
            assert.deepEqual(await agenda.filterParameters("remove 2"),
                {
                    modifier: "remove",
                    text: "2"
                }
            );
        });
        it('remove non-number', async function () {
            await expect(agenda.filterParameters("remove test")).to.be.rejectedWith("Second parameter of `remove` modifier must be a numeric value");
        });
        it('remove number less than 1', async function () {
            await expect(agenda.filterParameters("remove 0")).to.be.rejectedWith("Second parameter of `remove` modifier must be a numeric value");
        });
    });
    describe('generateListMessage', function () {
        it('no agenda items', async function () {
            assert.deepEqual(await agenda.generateListMessage("meeting\nalert-single-channel\n#general\ndefault\n\nN/A"), "There are currently no agenda items for the next meeting.");
        });
        it('1 agenda item', async function () {
            assert.deepEqual(await agenda.generateListMessage("meeting\nalert-single-channel\n#general\ndefault\ntest\nN/A"), "Please see agenda items:\n    1. test");
        });
        it('2 agenda items', async function () {
            assert.deepEqual(await agenda.generateListMessage("meeting\nalert-single-channel\n#general\ndefault\ntest, test2\nN/A"), "Please see agenda items:\n    1. test\n    2. test2");
        });
    });
    describe('addAgendaItemToDescription', function () {
        it('start no agenda items, add one', async function () {
            assert.deepEqual(await agenda.addAgendaItemToDescription("meeting\nalert-single-channel\n#general\ndefault\n\nN/A", "item1"), "meeting\nalert-single-channel\n#general\ndefault\nitem1\nN/A");
        });
        it('start one agenda item, add one', async function () {
            assert.deepEqual(await agenda.addAgendaItemToDescription("meeting\nalert-single-channel\n#general\ndefault\ntest\nN/A", "item1"), "meeting\nalert-single-channel\n#general\ndefault\ntest,item1\nN/A");
        });
    });
    describe('removeAgendaItemFromDescription', function () {
        it('remove agenda item', async function () {
            assert.deepEqual(await agenda.removeAgendaItemFromDescription("meeting\nalert-single-channel\n#general\ndefault\nitem1\nN/A", 1), "meeting\nalert-single-channel\n#general\ndefault\n\nN/A");
        });
    });
}); 