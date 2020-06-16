# Minerva

## What is Minerva?

Minerva is Waterloo Rocketry's soon-to-be slackbot. Minerva will handle all meetings, commands, and other slackbot stuff for the entire team.

## How does it work?

Minerva makes use of Google Firebase Functions to listen to HTTP requests made by Slack and other APIs to create custom responses.

## Features

- [Notify](#Notify)
- [Event Manager](#Event-Manager)

### Notify

This is the Slack command `/notify <link-to-message> [alert/alert-single-channel] [#channel1, #channel2, ...]`. Using this command allows you to copy a message from one channel to others with a variety of parameters. **This is restricted to admins only**.

#### Required parameters

- `<link-to-message>`. The link to the message you want to copy. (hover on the message -> hit the dots -> copy link) 

#### Optional parameters
- `[#channel1, #channel2, ...]`. By specifying channels in a comma separated list you can choose to notify only the selected channels. To select all default channels, do not specify any.
- `[alert-single-channel]`. This parameter will cause the bot to search the selected channels for any single channel guests and direct message them the linked message.
- `[alert]`. This parameter will cause the bot to alert (@channel) each listed channel

#### Examples: 

- Today is the first meeting of project proposals! Shirley wants everyone to alert everyone on the team, so she says: `@everyone project proposals are today at 8pm! Here is the link: https://example.com`. She wants to *alert* everyone of this message, so she uses `/notify <link-to-message> alert-single-channel`
- It's the time of the project proposals meeting, but Shirley doesn't want to ping the single-channel guests again. Instead she just wants to post the meeting link accross all channels. She uses: `/notify <link-to-message>`
- Roman and zach are running a rec-elec meeting. Roman sends a message in #recovery saying: `@channel rec-elec meeting is right now!`. To copy it and alert #electrical, roman uses `/notify <link-to-message> alert #electrical`

### Events

Minerva can also manage meetings and scheduled events based on the team's Google Calendar. By reading metadata in the description of the event Minerva can determine things like location, channels to alert, times, etc. 

Two reminders are sent about each event:

- 6 hours before an event is scheduled to start a reminder is sent out. 
- 5 minutes before an event is scheduled to start an alert is sent out.

#### Setup

Located in firebase environment variables are several fields that are required for proper usage:

- calendar.secret = Google Cloud Client Secret Key
- calendar.client = Google Cloud Client ID
- calendar.redirect = Google Cloud Redirect URL
- calendar.token = Refresh Token of the rocketry gmail account

Due to security, these variables are not distributed in the code. See these links for information on the credentials required: [1](https://developers.google.com/calendar/quickstart/nodejs) [2](https://medium.com/@vishnuit18/google-calendar-sync-with-nodejs-91a88e1f1f47) [3](https://stackoverflow.com/questions/58460476/where-to-find-credentials-json-for-google-api-client) 

#### Usage

To use, simply create events on the rocketry Google Calendar. In the description, encode data as follows:

```
<meeting-type>
<alert/alert-single-channel/alert-main-channel/copy/no-reminder>
<#main_channel>
[#any #additional #channels]
[agenda,items,in,comma,separated,list,or,blank,for,nothing]
[additional notes, or blank for nothing, formatted in markdown if desired]
```

_<> denotes required item_
_[] denotes optional item_

- `meeting-type` can be: meeting (for a general or subteam meeting),, test (for a cold flow, static fire), or other
- `alert` will @channel all channels listed (main and additional)
- `alert-single-channel` will @channel the main channel, and direct message single-channel guests in the additional channels
- `alert-main-channel` will @channel the main channel, and post the message (sans-@channel) to additional channels
- `copy` will post the message to all channels listed.
- `no-reminder` no reminders or alerts will be posted about this event.
- `additional notes` are notes appended to the end of the message if they exist

See [here](https://imgur.com/a/eemnfaf) for examples of what the messages look like (as of June 14th 2020)

#### Limitations

- Minerva must be invited to all listed channels otherwise `not_in_channel` is thrown
- Channel names must be prepended by a #

#### Managing agenda items

You can manage agenda items using the `/agenda <add/list/remove>` command, available to all users. Usage of this command is heavily dependant on the channel it is executed from. 

##### Usage

This command looks for the next event of type `meeting` that contains the same `main_channel` as the channel the command was executed from. If an event is found matching these criteria the command will modify based on the following conditions:

- `/agenda add <item text>` the text after "add" will be added as an agenda item
- `/agenda list` will display a numerical list of the next events agenda items
- `/agenda remove <item number>` removes the n-th element from the agenda item list of the next event