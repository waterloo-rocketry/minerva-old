//const meeting_handler = require("../handlers/calendar-handler");
const slack_handler = require("../handlers/slack-handler");

module.exports.send = async function (userId, textParams, originChannelID, originChannelName, trigger) {
    try {
        if (textParams.startsWith("reminder")) {
            return require("./meeting/reminder").send(userId, textParams.replace("reminder ", ""), originChannelName);
        } else if (textParams.startsWith("edit")) {
            return require("./meeting/edit").send(userId, textParams.replace("edit ", ""), originChannelID, originChannelName, trigger);
        } else {
            return slack_handler.openModal(trigger, {
                callback_id: "ryde-46e2b0",
                title: "Request a Ride",
                submit_label: "Request",
                state: "Limo",
                elements: [
                    {
                        type: "text",
                        label: "Pickup Location",
                        name: "loc_origin",
                    },
                    {
                        type: "text",
                        label: "Dropoff Location",
                        name: "loc_destination",
                    },
                ],
            });
            //return Promise.reject("Incorrect usage: /reminder <reminder/edit>");
        }
    } catch (error) {
        return Promise.reject(error);
    }
};
