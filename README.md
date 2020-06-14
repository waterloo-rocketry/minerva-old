# Minerva

## What is Minerva?

Minerva is Waterloo Rocketry's soon-to-be slackbot. Minerva will handle all meetings, commands, and other slackbot stuff for the entire team.

## How does it work?

Minerva makes use of Google Firebase Functions to listen to HTTP requests made by Slack and other API's to create custom responses.

## Features

### Notify

This is the Slack command `/notify <link-to-message> [alert/alert-single-channel] [#channel1, #channel2, ...]`. Using this command allows you to copy a message from one channel to others with a variety of parameters.

#### Required parameters

- `<link-to-message>`. The link to the message you want to copy. (hover on the message -> hit the dots -> copy link) 

#### Optional parameters
- `[#channel1, #channel2, ...]`. By specifying channels in a comma separated list you can choose to notify only the selected channels. To select all default channels, do not specify any.
- `[alert-single-channel]`. This parameter will cause the bot to search the selected channels for any single channel guests and direct message them the linked message.

#### Examples: 

- Today is the first meeting of project proposals! Shirley wants everyone to alert everyone on the team, so she says: `@everyone project proposals are today at 8pm! Here is the link: https://example.com`. She wants to *alert* everyone of this message, so she uses `/notify <link-to-message> alert-single-channel`
- It's the time of the project proposals meeting, but Shirley doesn't want to ping the single-channel guests again. Instead she just wants to post the meeting link accross all channels. She uses: `/notify <link-to-message>`
- Roman and zach are running a rec-elec meeting. Roman sends a message in #recovery saying: `@channel rec-elec meeting is right now!`. To copy it and alert #electrical, roman uses `/notify <link-to-message> alert #electrical`

### Meeting Manager

Minerva can also manage meetings and scheduled events based on the Google Calendar's scheduled events. By reading metadata in the description of the event Minerva can determine things like location, channels to alert, times, etc. 

Two reminders are sent about each meeting:

- 6 hours before an event is scheduled to start a reminder is sent out. 
- 5 minutes before an event is scheduled to start an alert is sent out (i.e. @channel).


#### Setup

Not committed to this repository is a file `functions/credentials.json`. Inside of this file there are several fields that are required for proper usage:

- Google Cloud Client Secret Key
- Google Cloud Client ID
- Refresh Token of the rocketry gmail account

Due to security, this config file is not uploaded since with the file calendar read/write access is granted.

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

- `meeting-type` can be: general (for a general team meeting), subteam (for a sub-team meeting), test (for a cold flow, static fire), or other (for other stuff)
- `alert` will @channel all channels listed (main and additional)
- `alert-single-channel` will @channel the main channel, and direct message single-channel guests in the additional channels
- `alert-main-channel` will @channel the main channel, and post the message (sans-@channel) to additional channels
- `copy` will post the message to all channels listed.
- `no-reminder` no reminders or alerts will be posted about this event.

##### Limitations

- Minerva must be invited to all listed channels
- Channels must be prepended by a #
- There is no limit to agenda items

#### Adding agenda items

You can add agenda items 