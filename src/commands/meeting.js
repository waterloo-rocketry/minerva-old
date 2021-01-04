module.exports.send = async function (userId, textParams, originChannelID, originChannelName, trigger) {
    if (textParams.startsWith("reminder")) {
        return require("./meeting/reminder").send(originChannelID);
    } else if (textParams.startsWith("edit")) {
        return require("./meeting/edit").send(originChannelID, trigger);
    } else {
        return Promise.reject("Incorrect usage: /meeting <reminder/edit>");
    }
};
