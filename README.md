# Minerva

## What is Minerva?

Minerva is Waterloo Rocketry's soon-to-be slackbot. Minerva will handle all meetings, commands, and other slackbot stuff for the entire team.

## How does it work?

Minerva makes use of Google Firebase Functions to listen to HTTP requests made by the Slack API.

## Features

### Notify

This is the Waterloo Rocketry Slack `/notify <link-to-message> [alert] [alert-single-channel] [#channel1, #channel2, ...]` command. Using this command allows you to copy a message from one channel to selected channels. Additionally, there is the option to alert single-channel guests of this message.

### Required parameters

- `<link-to-message>`. The link to the message you want to copy. (hover on the message -> hit the dots -> copy link) 

### Optional parameters
- `[#channel1, #channel2, ...]`. By specifying channels in a comma separated list you can choose to notify only the selected channels. To select all channels, do not specify any channels.
- `[alert-single-channel]`. Including "alert-single-channel' will cause the bot to @ all single channel users in the selected channels in the thread of the copied message.

Examples: 

- Today is the first meeting of project proposals! Shirley wants everyone to alert everyone on the team, so she says: `@everyone project proposals are today at 8pm! Here is the link: https://example.com`. She wants to *alert* everyone of this message, so she uses `/notify <link-to-message> alert-single-channel`
- It's the time of the project proposals meeting, but Shirley doesn't want to ping the single-channel guests again. Instead she just wants to post the meeting link accross all channels. She uses: `/notify <link-to-message>`
- Roman and zach are running a rec-elec meeting. Roman sends a message in #recovery saying: `@channel rec-elec meeting is right now!`. To copy it and alert #electrical, roman uses `/notify <link-to-message> alert #electrical`