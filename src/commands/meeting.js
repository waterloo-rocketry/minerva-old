module.exports.send = async function (userId, textParams, originChannelID, originChannelName, trigger) {
    if (textParams.startsWith("reminder")) {
        return require("./meeting/reminder").send(originChannelID);
    } else if (textParams.startsWith("edit") || textParams.trim().length === 0) {
        // the "edit" path is the default if no textParam is provided
        return require("./meeting/edit").send(originChannelID, trigger);
    } else {
        return Promise.reject("Incorrect usage: /meeting <reminder/edit>");
    }
};
