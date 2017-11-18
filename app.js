// This loads the environment variables from the .env file
// require('dotenv-extended').load();
require('./config');

const config = require('./config');

var builder = require('botbuilder');
var restify = require('restify');

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

server.post('/api/messages', connector.listen());

var userStore = [];
var bot = new builder.UniversalBot(connector, function (session) {
    // store user's address
    var address = session.message.address;
    userStore.push(address);
    console.log('push');

    // end current dialog
    // session.endDialog('You\'ve been invited to a survey! It will start in a few seconds...');
    session.endDialog();
});

// Every 5 seconds, check for new registered users and start a new dialog
setInterval(function () {
    var newAddresses = userStore.splice(0);
    newAddresses.forEach(function (address) {

        console.log('Starting survey for address:', address);

        // new conversation address, copy without conversationId
        var newConversationAddress = Object.assign({}, address);
        // delete newConversationAddress.conversation;

        // start survey dialog
        bot.beginDialog(newConversationAddress, 'intro_survey', null, function (err) {
            if (err) {
                // error ocurred while starting new conversation. Channel not supported?
                bot.send(new builder.Message()
                    .text('This channel does not support this operation: ' + err.message)
                    .address(address));
            }
        });

    });
}, 500);

bot.dialog('survey', [
    function (session) {
        builder.Prompts.text(session, 'Hello... What\'s your name?');
    },
    function (session, results) {
        session.userData.name = results.response;
        builder.Prompts.number(session, 'Hi ' + results.response + ', How many years have you been coding?');
    },
    function (session, results) {
        session.userData.coding = results.response;
        builder.Prompts.choice(session, 'What language do you code Node using? ', ['JavaScript', 'CoffeeScript', 'TypeScript']);
    },
    function (session, results) {
        session.userData.language = results.response.entity;
        session.endDialog('Got it... ' + session.userData.name +
            ' you\'ve been programming for ' + session.userData.coding +
            ' years and use ' + session.userData.language + '.');
    }
]);

bot.dialog('intro_survey', [
    function (session) {
        builder.Prompts.text(session, 'Hi! I am Sorgenfreßer. Whats\'s your name?');
    },
    function (session, result) {
        builder.Prompts.text(session, 'Hi ' + result.response+ '!, How are you feeling today?');
    },
    function (session, result) {
        console.dir(result);
        builder.Prompts.text(session, 'What are you doing right now, besides talking to me?');
    },
    function (session, result) {
        builder.Prompts.choice(
            session,
            'What are feeling you more?',
            ['A', 'B'],
            {
                maxRetries: 3,
                retryPrompt: 'Not a valid option'
            });
    },
    function (session, result) {
        builder.Prompts.text(session, result.response.entity);
    },
]);