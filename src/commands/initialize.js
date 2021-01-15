module.exports.send = async function () {
    await require("../interactivity/initialize").send();
    return Promise.resolve(
        "Initialization message(s) sent. Don't see your event's initialization message?" +
            "It may be too far in the future. Try again another time, or initialize manually."
    );
};
