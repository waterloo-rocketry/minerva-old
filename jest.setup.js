jest.mock("./src/handlers/environment-handler", () => {
    return {
        environment: "test",
        slackToken: "test",
        googleClient: "test",
        googleSecret: "test",
        googleRedirect: "test",
        googleToken: "test",
        slackUrl: "https://chrisslackbottesting.slack.com"
    };
});