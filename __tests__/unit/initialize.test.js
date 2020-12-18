const assert = require("assert");
const chai = require("chai");
chai.use(require("chai-as-promised"));
const MockDate = require("mockdate");

const initialize = require("../../src/interactivity/initialize");

describe("interactivity/initialize.js tests", function () {
    describe("isEventTomorrow", function () {
        it("tomorrow date", function () {
            MockDate.set(new Date(2020, 12, 12));
            assert.deepStrictEqual(initialize.isEventTomorrow(new Date(2020, 12, 13)), true);
        });

        it("not tomorrow date", function () {
            MockDate.set(new Date(2020, 12, 12));
            assert.deepStrictEqual(initialize.isEventTomorrow(new Date(2020, 12, 12)), false);
            assert.deepStrictEqual(initialize.isEventTomorrow(new Date(2020, 12, 14)), false);
        });
    });
});

MockDate.reset();
