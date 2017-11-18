const restify = require('restify');
const builder = require('botbuilder');

const config = require('./config');

var botConnectorOptions = {
    appId: process.env.BOTFRAMEWORK_APPID ? process.env.BOTFRAMEWORK_APPID : config.MS_APP_ID ,
    appPassword: process.env.BOTFRAMEWORK_APPSECRET ? process.env.BOTFRAMEWORK_APPSECRET :config.MS_APP_PASS
};

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector(botConnectorOptions);

// Listen for messages from users
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function (session) {
    session.send("You said: %s", session.message.text);
});