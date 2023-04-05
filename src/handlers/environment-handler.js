module.exports.environment = process.env.NODE_ENV;
module.exports.slackToken = process.env.slack_token;
module.exports.googleClient = process.env.googleaccount_client;
module.exports.googleSecret = process.env.googleaccount_secret;
module.exports.googleRedirect = process.env.googleaccount_redirect;
module.exports.googleToken = process.env.googleaccount_token;
module.exports.slackUrl =
    process.env.NODE_ENV == "production"
        ? "https://waterloorocketry.slack.com"
        : "https://waterloorocketrydev.slack.com";
