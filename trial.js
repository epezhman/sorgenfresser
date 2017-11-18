const restify = require('restify');
const builder = require('botbuilder');
const config = require('./config');

const botConnectorOptions = {
    appId: process.env.BOTFRAMEWORK_APPID ? process.env.BOTFRAMEWORK_APPID : config.MS_APP_ID ,
    appPassword: process.env.BOTFRAMEWORK_APPSECRET ? process.env.BOTFRAMEWORK_APPSECRET :config.MS_APP_PASS
};

const luisModel = process.env.LUIS_MODEL ? process.env.LUIS_MODEL :config.LUIS;

const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});
const connector = new builder.ChatConnector(botConnectorOptions);

server.post('/api/messages', connector.listen());

let bot = new builder.UniversalBot(connector, function (session) {
    session.send('How you feeling?');
});

let recognizer = new builder.LuisRecognizer(luisModel);
bot.recognizer(recognizer);
bot.dialog('None', [
    function (session, args, next) {
        session.send('I can not understand your feeling');
    }
]).triggerAction({
    matches: 'None'
});


bot.dialog('Good', [
    function (session, args, next) {
        session.send('You are feeling good');
    }
]).triggerAction({
    matches: 'FeelingGood'
});

bot.dialog('Bad', [
    function (session, args, next) {
        session.send('You are feeling sad');
    }
    ]).triggerAction({
    matches: 'FeelingBad'
});




// bot.recognizer(new builder.LuisRecognizer(luisModel));
//
//
// var recognizer = new builder.LuisRecognizer(luisModel);
// var intents = new builder.IntentDialog({ recognizers: [recognizer] });
//
// var bot = new builder.UniversalBot(connector, function (session, args) {
//     session.send("Hi... I'm the note bot sample. I can create new notes, read saved notes to you and delete notes.");
//
//     // If the object for storing notes in session.userData doesn't exist yet, initialize it
//     if (!session.userData.notes) {
//         session.userData.notes = {};
//         console.log("initializing userData.notes in default message handler");
//     }
//
//     console.log(intents)
// });
//
// bot.dialog('SearchHotels', [
//     function (session, args, next) {
//     }
// ]).triggerAction({
//     matches: 'SearchHotels',
//     onInterrupted: function (session) {
//         session.send('Please provide a destination');
//     }
// });
//
// bot.dialog('/', intents);
// intents.matches('None', '/none')
//     .matches('FeelingGood', '/feelingGood')
//     .matches('FeelingBad', '/feelingBad')
//     .onDefault(builder.DialogAction.send("I'm sorry. I didn't understand."));
//
// bot.dialog('/none', function(session){
//     session.send("No intent");
// });
//
// bot.dialog('/feelingGood', function(session){
//     //Add custom code here to implent get weather feature
//     session.send("Good");
// });
//
// bot.dialog('/feelingBad', function(session){
//     //Add custom code here to implement book flight feature
//     session.send("Bad");
// });
// var bot = new builder.UniversalBot(connector, [
//     function (session) {
//         session.beginDialog('checkUp', session.userData.profile);
//     },
//     function (session, results) {
//         session.userData.profile = results.response; // Save user profile.
//         session.send(`Hello ${session.userData.profile.name}! I love ${session.userData.profile.company}!`);
//     }
// ]);
// bot.dialog('checkUp', [
//     function (session, args, next) {
//         session.dialogData.profile = args || {}; // Set the profile or create the object.
//         session.send("Hey there, I'm Sorgenfresser and I'm here to take care of you.");
//         if (!session.dialogData.profile.name) {
//             builder.Prompts.text(session, "What's your name?");
//         } else {
//             next();
//         }
//     },
//     function (session, results, next) {
//         if (results.response) {
//             // Save user's name if we asked for it.
//             session.dialogData.profile.name = results.response;
//         }
//         builder.Prompts.text(session, `Very well, how are you feeling today ${session.userData.profile.name}?`);
//     }
// ]);