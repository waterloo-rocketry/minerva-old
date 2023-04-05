module.exports.filter = async function (error) {
    const errorString = JSON.stringify(error);

    if (errorString.includes("trigger_id")) {
        return Promise.reject(
            "`trigger_id` expired. Sometimes this can happen when this command hasn't been used for a while. Try again.",
        );
    } else if (error.data != undefined && error.data.error === "not_found") {
        return Promise.resolve();
    } else if (error === "no-send") {
        return Promise.resolve();
    }

    return Promise.reject(error);
};
