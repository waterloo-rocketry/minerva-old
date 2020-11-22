module.exports.slackToken = process.env.production_slack_token;
module.exports.googleClient = process.env.production_googleaccount_client;
module.exports.googleSecret = process.env.production_googleaccount_secret;
module.exports.googleRedirect = process.env.production_googleaccount_redirect;
module.exports.googleToken = process.env.production_googleaccount_token;

module.exports.setDefaults = function (context) {
    alias = context.invokedFunctionArn.split(":")[7];

    if (alias === "development") {
        this.slackToken = process.env.development_slack_token;
        this.googleClient = process.env.development_googleaccount_client;
        this.googleSecret = process.env.development_googleaccount_secret;
        this.googleRedirect = process.env.development_googleaccount_redirect;
        this.googleToken = process.env.development_googleaccount_token;
    }
};
