// AIzaSyBO2ohvn5GHfOLCMc2OLgV5UR-4W8VFCT0

const { WebClient } = require('@slack/web-api');
const functions = require('firebase-functions');

const web = new WebClient(functions.config().calendar.token);
