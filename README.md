# Minerva

## What is Minerva?

Minerva is Waterloo Rocketry's soon-to-be slackbot. Minerva will handle all meetings, commands, and other slackbot stuff for the entire team.

## How does it work?

Minerva makes use of Google Firebase Functions to listen to HTTP requests made by Slack and other APIs to create custom responses.

## Features

-   [Notify](#Notify)
-   [Event Manager](#Events)

### Notify

This is the Slack command `/notify`. Using this command allows you to copy a message from one channel to others with a variety of parameters. **This is restricted to admins only**.

#### Required parameters

-   There are no required parameters. Executing this command will open a GUI for you to use to execute the command.

#### Examples

-   Today is the first meeting of project proposals! Shirley wants everyone to alert everyone on the team, so she says: `@everyone project proposals are today at 8pm! Here is the link: https://example.com`. She's already messaged #general and now wants to message the single-channel-guests. First she copies the link to the message, then runs `/notify`, pastes the link in, selects default channels, sets the alert type to `alert-single-channel`.
-   Roman and Zach are running a rec-elec meeting. Roman sends a message in #recovery saying: `@channel rec-elec meeting is right now!`. To copy it and alert #electrical, Roman copies the link to the message, runs `/notify`, fills in the link, selects #electrical and sets the alert-type to `alert` or `copy`.

### Events

Minerva can also manage meetings and scheduled events based on the team's Google Calendar. By reading metadata in the description of the event Minerva can determine things like location, channels to alert, times, etc.

Two reminders are sent about each event:

-   6 hours before an event is scheduled to start a reminder is sent out.
-   5 minutes before an event is scheduled to start an alert is sent out.

#### Setup

Located in AWS environment variables are several fields that are required for proper usage:

-   googleaccount_secret = Google Cloud Client Secret Key
-   googleaccount_client = Google Cloud Client ID
-   googleaccount_redirect = Google Cloud Redirect URL
-   googleaccount_token = Refresh Token of the rocketry gmail account

Due to security, these variables are not distributed in the code. See these links for information on the credentials required: [1](https://developers.google.com/calendar/quickstart/nodejs) [2](https://medium.com/@vishnuit18/google-calendar-sync-with-nodejs-91a88e1f1f47) [3](https://stackoverflow.com/questions/58460476/where-to-find-credentials-json-for-google-api-client)

#### Usage

To use, simply create events on the rocketry Google Calendar. Minerva will scan the calendar once an hour and check the next 10 events. If any have undefined descriptions, she will send an interactive button to help initialize them.

#### Description Elements

-   `mainChannel` is the designated channel responsible for this event\*
-   `eventType` can be: meeting (for a general or subteam meeting), test (for a cold flow, static fire), other, or none (for nothing)\*
-   `additionalChannels` can be a space separated list of channels (prepended with a `#`) or 'default' for the default set of channels
    -   `default` is currently set as: software, recovery, propulsion, payload, general, electrical, airframe, liquid_engine, business and mechanical
-   `alertType`\*
    -   `alert` will @channel all channels listed (main and additional)
    -   `alert-single-channel` will @channel the main channel, and direct message single-channel guests in the additional channels
    -   `alert-main-channel` will @channel the main channel, and post the message (sans-@channel) to additional channels
    -   `copy` will post the message to all channels listed.
-   `notes` are notes appended to the end of the message if they exist
-   `link` link to the meeting
-   `agendaItems` agenda items for the event

_\* denotes required item_

See [here](https://imgur.com/a/eemnfaf) for examples of what the messages look like (as of June 14th 2020)

#### Limitations

-   Minerva must be invited to all listed channels otherwise `not_in_channel` is thrown

#### Managing events

You can manage events using `/meeting edit` in the main channel for the event. By doing so, you will open a GUI editor where you can edit the parameters of the event. To make these permanent, and not just for the upcoming meeting, you will have to use the `Save for This and Following Events` feature on the Google Calendar website.
