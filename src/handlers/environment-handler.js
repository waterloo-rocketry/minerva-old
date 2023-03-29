const fetch = require('node-fetch');

const getSsmParameter = async (name) => {
    // Retrieve the parameter from the local endpoint provided by the AWS Parameters and Secrets Lambda Extension
    const secretsExtensionPort = process.env.secrets_extension_http_port;
    const url = `http://localhost:${secretsExtensionPort}/systemsmanager/parameter/get?name=${name}`
    const response = await fetch(url, { 
        method: 'GET',
        headers: {
            "X-Aws-Parameters-Secrets-Token": process.env.AWS_SESSION_TOKEN,
        }
    });

    if (!response.ok) {
        throw new Error(
        `Error occured while requesting secret ${secretName}. Responses status was ${response.status}`
        );
    }

    const secretContent = await response.json()
    return secretContent.SecretString;
};

module.exports.environment = process.env.NODE_ENV;
module.exports.slackToken = getSsmParameter(process.env.slack_token);
module.exports.googleClient = getSsmParameter(process.env.googleaccount_client);
module.exports.googleSecret = getSsmParameter(process.env.googleaccount_secret);
module.exports.googleRedirect = getSsmParameter(process.env.googleaccount_redirect);
module.exports.googleToken = getSsmParameter(process.env.googleaccount_token);
module.exports.slackUrl =  process.env.NODE_ENV == "production" ? "https://waterloorocketry.slack.com" : "https://chrisslackbottesting.slack.com";

