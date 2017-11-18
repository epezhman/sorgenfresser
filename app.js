// This loads the environment variables from the .env file
// require('dotenv-extended').load();
require('./config');

const config = require('./config');

var builder = require('botbuilder');
var restify = require('restify');
var emoji = require('node-emoji');

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

var Moods = {
    Good: 'Good',
    Bad: 'Bad'
};

var Duration = {
    hours: 'A couple of hours',
    days: 'A few days',
    weeks: 'More than one week'
};

var Emoticons = {
    smiley: emoji.get(':smile'),
    happy: emoji.get(':grin'),
    notHappy: emoji.get(':pensive')
};

var retryPrompt = 'Sorry! I did not get that. ' + Emoticons.notHappy + '\n\n I am very young. I was born yesterday! I promise I will get better' + Emoticons.smiley + '. \n\n In the meantime, could you help me understand you by selecting one of the options?';

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
        session.conversationData['username'] = result.response;
        builder.Prompts.choice(
            session,
            'Hi ' + session.conversationData['username'] + '!, How are you feeling today?',
            [Moods.Good, Moods.Bad],
            {
                maxRetries: 3,
                retryPrompt: retryPrompt,
                listStyle: builder.ListStyle.button
            });
    },
    function (session, result) {
        if (!result.response) {
            // session.send('Ooops! Too many attemps :( But don\'t worry, I\'m handling that exception and you can try again!');
            return session.endDialog();
        }
        
        session.on('error', function (err) {
            session.send('Failed with message: %s', err.message);
            session.endDialog();
        });

        // continue on proper dialog
        var selection = result.response.entity;
        
        switch (selection) {
            case Moods.Good:
                return session.beginDialog('good_mood');
            case Moods.Bad:
                return session.beginDialog('bad_mood');
        }
    }
]);

bot.dialog('good_mood', [
    function (session) {
        var msg = createAnimationCard(session, 'https://media.giphy.com/media/liFaAWEOa1uKc/giphy.gif', 'Thats\'s awesome!');
        session.send(msg);
        session.delay(1000);
        builder.Prompts.choice(
            session,
            'He seems happy too!',
            [Emoticons.smiley, Emoticons.happy],
            {
                maxRetries: 3,
                retryPrompt: retryPrompt,
                listStyle: builder.ListStyle.button
            });
    },
    function (session ,result) {
        session.delay(2000);
        session.send('I will check up on you later!');
        session.delay(3000);
        session.send('Bye '+ session.conversationData['username'] + '!');
        return session.endDialog();
    }
]);

bot.dialog('bad_mood', [
    function (session) {
        builder.Prompts.choice(
            session,
            'Oh! I am sorry to hear that. How long have you been feeling this way?',
            [
                // Duration.hours,
                Duration.days,
                Duration.weeks],
            {
                maxRetries: 3,
                retryPrompt: retryPrompt,
                listStyle: builder.ListStyle.button
            });
    },
    function (session, result) {
        if (!result.response) {
            // session.send('Ooops! Too many attemps :( But don\'t worry, I\'m handling that exception and you can try again!');
            return session.endDialog();
        }

        session.on('error', function (err) {
            session.send('Failed with message: %s', err.message);
            session.endDialog();
        });

        var selection = result.response.entity;

        switch (selection) {
            case Duration.hours:
                return session.beginDialog('hours');
            case Duration.days:
                return session.beginDialog('days');
            case Duration.weeks:
                return session.beginDialog('weeks');
        }
    }
]);

bot.dialog('hours', [
    function (session) {
        builder.Prompts.text(session, 'hours');
    },
    function (session, result) {
        session.endDialog();
    }
]);

bot.dialog('days', [
    function (session) {
        // builder.Prompts.text(session, 'days');
        var msg = createAnimationCard(
            session,
            'https://media.giphy.com/media/SggILpMXO7Xt6/giphy.gif',
            null,
            'This should cheer you up!'
        );
        session.send(msg);
        session.delay(1000);

        builder.Prompts.choice(
            session,
            'What do you think?',
            [Emoticons.happy, Emoticons.notHappy],
            {
                maxRetries: 3,
                retryPrompt: retryPrompt,
                listStyle: builder.ListStyle.button
            });
    },
    function (session, result) {
        var selection = result.response.entity;
        switch (selection) {
            case Emoticons.happy: {
                session.send(createVideoCard(session, 'https://www.youtube.com/watch?v=NDNmC11vGYk', 'This video might help'));
                session.delay(5000);
                session.send('See you next time ' + Emoticons.smiley);
                return session.endDialog();
                // break;
            }
            case Emoticons.notHappy: {
                var msg = createAnimationCard(session, 'https://media.giphy.com/media/NKTk26o6xzNFm/giphy.gif', null, 'Well sometimes you need help to feel good');
                session.send(msg);
                session.send('Go out, call a friend, family or a loved one and don\'t spend your time talking to a computer' + Emoticons.smiley +'. See you next time.');
                return session.endDialog();
            }
        }
    },
    function (session, result) {
        session.endDialog();
    }
]);

bot.dialog('weeks', [
    function (session) {
        session.delay(2000);
        session.send('I think it would be helpful to look for an professional to help you with this. I can help you look for a qualified therapist. Let me see what therapist are near you...');
        session.delay(2000);
        session.send('I have found the following qualified therapists near you:');
        session.delay(3000);
        session.send(
            'Dipl.-Psych. Dr. rer. Medic. Jörn Güttgemanns\n\n' +
            'Dipl.-Psych. Bernard Hege\n\n' +
            'Dipl.-Psych. Beate Knott\n\n' +
            'Dipl.-Psych. Birgit Weißenfels'
        );
        session.delay(1500);
        builder.Prompts.choice(
            session,
            'What do you think? Should I contact them for you?',
            ['Yes', 'No'],
            {
                maxRetries: 3,
                retryPrompt: retryPrompt,
                listStyle: builder.ListStyle.button
            });
    },
    function (session, result) {
        session.delay(2000);
        switch (result.response.entity) {
            case 'Yes': {
                session.send(' I have contacted these therapists for you. They should answer shortly.');
                session.delay(2000);
                session.send('See you next time ' + Emoticons.smiley);
                session.send('Disclaimer: Sorgenfreßer is still a prototype and does not yet email therapists for you. If you are looking for therapy in Germany, please go to this link:');
                session.delay(1000);
                session.send('http://www.psychotherapiesuche.de/');
                session.send('Goodbye! ' + Emoticons.smiley);
                return session.endDialog();
            }
            case 'No': {
                session.send(createVideoCard(session, 'https://www.youtube.com/watch?v=OxuZiqY5ypU', null, 'You should give therapy a chance. Check out this video'));
                session.send('Goodbye! ' + Emoticons.smiley);
                return session.endDialog();
            }
        }
    },
    function (session, result) {
        session.endDialog();
    }
]);


function createVideoCard(session, url, title, subtitle, text) {
    return new builder.Message(session).addAttachment(new builder.VideoCard(session)
        .title(title)
        .subtitle(subtitle)
        .text(text)
        .media([
            { url: url }
        ]));
}


function createAnimationCard(session, url, title, subtitle) {
    return new builder.Message(session).addAttachment(
            new builder.AnimationCard(session)
                .title(title)
                .subtitle(subtitle)
                .media([
                    {
                        url: url
                    }
                ])
        );
}
