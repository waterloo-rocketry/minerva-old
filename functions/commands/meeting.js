module.exports.send = async function (userId, textParams, originChannelID, originChannelName, trigger) {
    if (textParams.startsWith("reminder")) {
        return require("./meeting/reminder").send(userId, textParams.replace("reminder ", ""), originChannelName);
    } else if (textParams.startsWith("edit")) {
        return require("./meeting/edit").send(userId, textParams.replace("edit ", ""), originChannelID, originChannelName, trigger);
    } else {
        return Promise.reject("Incorrect usage: /reminder <reminder/edit>");
    }
};
