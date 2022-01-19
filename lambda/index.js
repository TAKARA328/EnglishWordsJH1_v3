// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.

// Alexaスキルエキスパートによるレビュー 対応版

const Alexa = require('ask-sdk-core');
const util = require('util');
var rp = require('request-promise');

let questionno  = 0;
let correct     = 0;
let correcttext = '';
let wordid      = 'ZZZZZZ';
let worddata    = [];
let evaluation  = ['Oh my got.', 'Good.', 'Good.', 'Nice.', 'Great.', 'Excellent.'];
let ending      = ['Hope to see you again.', 'See you next time.', 'See you later.'];
 
const apl_document  = require('./apl/document.json');
const apl_data      = require('./apl/data.json');
const apl_directive = require('./apl/directive.json');


let options = {
    uri: 'https://script.google.com/macros/s/AKfycbwKRCDnSBXmBi2_GUzPp4OcytgP--NdgAe2WA-k3JoPS-7bKvs/exec', // URL
    method: 'GET',
    timeout: 30 * 1000, // タイムアウト指定しないと帰ってこない場合がある
    qs: { // query string
        s: 'wordslist'
    },
    headers: { // header
        'User-Agent': 'Request-Promise'
    },
    json: true // Automatically parses the JSON string in the response
  }

// Googleスプレッドシートの値を取得
async function getGoogleSpreadSheetsValue() {
    console.log(`In getGoogleSpreadSheetsValue`);
    let returnvalue = '';
    console.log(`getGoogleSpreadSheetsValue()::options: ${util.inspect(options)}`);
    await rp(options)
      .then(res => {
        returnvalue = res;
        console.log(`getGoogleSpreadSheetsValue()::RequestPromise Success: ${util.inspect(res)}`);
      })
      .catch(error => {
        // promiseのエラーをキャッチします
        returnvalue = {id:"ERROR"};
        console.log(error);
        console.log(`getGoogleSpreadSheetsValue()::RequestPromise error: statusCode${err.statusCode}  err:${ err }` );
      });
      console.log(`getGoogleSpreadSheetsValue()::returnvalue: ${returnvalue}` );
    return returnvalue;
  }
  

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {
        console.log(`LaunchRequestHandler`);
        console.log(`LaunchRequestHandler:handlerInput ${JSON.stringify(handlerInput)}`);

        questionno  = 0;
        correct     = 0;
        correcttext = '';

        // const speakOutput = '<speak>combine<amazon:domain name="conversational"><voice name="Joanna"><lang xml:lang="en-US">combine</lang></voice></amazon:domain></speak>';
        let speakOutput = '';
        let respeakOutput = '';

        // セッション情報
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        console.log(`LaunchRequestHandler:sessionAttributes ${JSON.stringify(sessionAttributes)}`);
        if (sessionAttributes.questionno) {
            console.log(`LaunchRequestHandler:questionno ${questionno} true`);
        } else {
            sessionAttributes.questionno = 0;
            sessionAttributes.correct = 0;
            sessionAttributes.correcttext = '';
            console.log(`LaunchRequestHandler:questionno ${questionno} false`);
        }
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        console.log(`LaunchRequestHandler:sessionAttributes ${JSON.stringify(sessionAttributes)}`);
        questionno = sessionAttributes.questionno;

        // 情報読み出し
        worddata = await getGoogleSpreadSheetsValue(wordid);
        sessionAttributes.worddata = worddata;
        console.log(`LaunchRequestHandler:worddata ${JSON.stringify(worddata)}`);
        console.log(`LaunchRequestHandler:worddata[${questionno}] ${JSON.stringify(worddata[questionno])}`);
        if (worddata.id === 'ERROR') {
            return ErrorHandler.handle(handlerInput);
        }

        speakOutput = `<speak><amazon:domain name="conversational">それでは、英単語の勉強を始めましょう！<voice name="Joanna"><lang xml:lang="en-US">let\'s get started!</lang></voice>、では、第${questionno+1}問、<voice name="Joanna"><lang xml:lang="en-US">${worddata[questionno].word}</lang></voice>、${worddata[questionno].word}の意味は何でしょう</amazon:domain></speak>`;
        respeakOutput = `<speak><amazon:domain name="conversational">もう一度、<voice name="Joanna"><lang xml:lang="en-US">${worddata[questionno].word}</lang></voice>、${worddata[questionno].word}の意味は何でしょう</amazon:domain></speak>`;

        // APL対応デバイスの判定
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            console.log(`LaunchRequestHandler:getSupportedInterfaces ['Alexa.Presentation.APL']`);
            apl_data.myData.small.bgImage = "https://dl.dropboxusercontent.com/s/17lmzxcum9voe87/bg_b.png";
            apl_data.myData.large.bgImage = "https://dl.dropboxusercontent.com/s/17lmzxcum9voe87/bg_b.png";
            apl_data.myData.small.stampImage = "https://dl.dropboxusercontent.com/s/17lmzxcum9voe87/bg_b.png";
            apl_data.myData.large.stampImage = "https://dl.dropboxusercontent.com/s/17lmzxcum9voe87/bg_b.png";
            apl_data.myData.correcttext = correcttext;
            apl_directive.document = apl_document;
            apl_directive.datasources = apl_data;
            console.log(`apl_directive:isAPL ${JSON.stringify(apl_directive)}`);
            handlerInput.responseBuilder
              .addDirective(apl_directive)
        }
          
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(respeakOutput)
            .getResponse();
    }
};

const AnswerIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
        && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AnswerIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AnswerOnlyIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'SkipIntent');
    },
    async handle(handlerInput) {
        console.log(`AnswerIntentHandler`);
        console.log(`AnswerIntentHandler:handlerInput ${JSON.stringify(handlerInput)}`);
        let speakOutput = '';
        let respeakOutput = '';

        // インテント名
        console.log(`AnswerIntentHandler:Alexa.getIntentName(handlerInput.requestEnvelope) ${Alexa.getIntentName(handlerInput.requestEnvelope)}`);

        // セッション情報
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        console.log(`AnswerIntentHandler:sessionAttributes ${JSON.stringify(sessionAttributes)}`);
        if (sessionAttributes.questionno === undefined) {
            console.log(`AnswerIntentHandler:questionno ${questionno} false`);
            return LaunchRequestHandler.handle(handlerInput);
        }
        questionno = sessionAttributes.questionno;
        correct = sessionAttributes.correct;
        worddata = sessionAttributes.worddata;
        correcttext = sessionAttributes.correcttext;

        // 正解を判定
        console.log(`AnswerIntentHandler::worddata[${questionno}].word ${worddata[questionno].word} | worddata[${questionno}].pronounce ${worddata[questionno].pronounce}`);
        // スキップ対応
        if (Alexa.getIntentName(handlerInput.requestEnvelope) === 'SkipIntent') {
            console.log(`AnswerIntentHandler:SKIP`);
            correcttext = correcttext + `誤　${worddata[questionno].word}\n`;
            speakOutput = `はい。スキップします。正解は、${worddata[questionno].mean} でした！`;
        } else {
            // スロット値
            const {confirmationStatus, slots} = handlerInput.requestEnvelope.request.intent;
            let wordname = slots.WordName.value;
            console.log(`AnswerIntentHandler::wordname ${wordname}`);
            let wordid;
            try {
                wordid = slots.WordName.resolutions.resolutionsPerAuthority[0].values[0].value.id;
            } catch (e) {
                wordid = "ZZZZZZ";
            }
            console.log(`AnswerIntentHandler::wordid ${wordid} / questionno ${questionno}`);

            if (worddata[questionno].word === wordid) {
                console.log(`AnswerIntentHandler::word ${worddata[questionno].word}`);
                correcttext = correcttext + `正　${worddata[questionno].word}\n`;
                speakOutput = '正解です。';
                correct++;
            } else {
                let pronouncearray = worddata[questionno].pronounce.split(',');
                console.log(`AnswerIntentHandler::worddata ${JSON.stringify(pronouncearray)}`);
                if (pronouncearray.includes(wordid)) {
                    correcttext = correcttext + `正　${worddata[questionno].word}\n`;
                    speakOutput = '正解です。';
                    correct++;
                } else {
                    correcttext = correcttext + `誤　${worddata[questionno].word}\n`;
                    speakOutput = `不正解です！正解は、${worddata[questionno].mean} です。`;
                }
            }
        }

        // セッション情報セット
        questionno++;
        sessionAttributes.questionno = questionno;
        sessionAttributes.correct = correct;
        sessionAttributes.correcttext = correcttext;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        console.log(`AnswerIntentHandler:sessionAttributes ${JSON.stringify(sessionAttributes)}`);

        if (questionno === 5) {
            console.log(`AnswerIntentHandler:correct ${correct}`);
            // Oh my got.  Good  Good  Nice  Great  Excellent  
            let endmessage = '';
            if (correct === 0) {
                endmessage = '正解数はゼロでした。';
            } else if (correct === 5) {
                endmessage = `全問正解でした。`;
            } else {
                endmessage = `${correct}問正解でした。`;
            }
            speakOutput = `<speak><amazon:domain name="conversational">${speakOutput} ${endmessage}<voice name="Joanna"><lang xml:lang="en-US">${evaluation[correct]}</lang></voice>、終わりです。<voice name="Joanna"><lang xml:lang="en-US">${ending[Math.floor( Math.random() * ending.length)]}</lang></voice></amazon:domain></speak>`;
//            questionno = 0;

            let smallImageUrl = 'https://dl.dropboxusercontent.com/s/yu06jlgcmk4jnj8/badge04.png';
            let largeImageUrl = 'https://dl.dropboxusercontent.com/s/yu06jlgcmk4jnj8/badge04.png';

            switch (correct){
                case 0:
                    smallImageUrl = 'https://dl.dropboxusercontent.com/s/67zy8orvddasab9/badge00.png';
                    largeImageUrl = 'https://dl.dropboxusercontent.com/s/67zy8orvddasab9/badge00.png';
                    break;
                case 1:
                    smallImageUrl = 'https://dl.dropboxusercontent.com/s/10e36pn3cdwxk8y/badge01.png';
                    largeImageUrl = 'https://dl.dropboxusercontent.com/s/10e36pn3cdwxk8y/badge01.png';
                    break;
                case 2:
                    smallImageUrl = 'https://dl.dropboxusercontent.com/s/10e36pn3cdwxk8y/badge01.png';
                    largeImageUrl = 'https://dl.dropboxusercontent.com/s/10e36pn3cdwxk8y/badge01.png';
                    break;
                case 3:
                    smallImageUrl = 'https://dl.dropboxusercontent.com/s/m8a414jsk1kbr7f/badge02.png';
                    largeImageUrl = 'https://dl.dropboxusercontent.com/s/m8a414jsk1kbr7f/badge02.png';
                    break;
                case 4:
                    smallImageUrl = 'https://dl.dropboxusercontent.com/s/nawyfz9pyn64h0e/badge03.png';
                    largeImageUrl = 'https://dl.dropboxusercontent.com/s/nawyfz9pyn64h0e/badge03.png';
                    break;
                case 5:
                    smallImageUrl = 'https://dl.dropboxusercontent.com/s/yu06jlgcmk4jnj8/badge04.png';
                    largeImageUrl = 'https://dl.dropboxusercontent.com/s/yu06jlgcmk4jnj8/badge04.png';
                    break;
                default:
                    smallImageUrl = 'https://dl.dropboxusercontent.com/s/67zy8orvddasab9/badge00.png';
                    largeImageUrl = 'https://dl.dropboxusercontent.com/s/67zy8orvddasab9/badge00.png';
            }

            // APL対応デバイスの判定
            if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
                console.log(`AnswerIntentHandler:getSupportedInterfaces ['Alexa.Presentation.APL']`);
                apl_data.myData.small.bgImage = smallImageUrl;
                apl_data.myData.large.stampImage = largeImageUrl;
                apl_data.myData.correcttext = correcttext.replace(/\n/g, '<br>');
                apl_directive.document = apl_document;
                apl_directive.datasources = apl_data;
                console.log(`apl_directive:isAPL ${JSON.stringify(apl_directive)}`);
                handlerInput.responseBuilder
                  .addDirective(apl_directive)
            }

            return handlerInput.responseBuilder
              .speak(speakOutput)
              .withStandardCard('毎日続けよう！', correcttext, smallImageUrl, largeImageUrl)
              .withShouldEndSession(true)
              .getResponse();
        } else {
            speakOutput = `<speak><amazon:domain name="conversational">${speakOutput}<voice name="Joanna"><lang xml:lang="en-US">Question ${questionno+1}!</lang></voice>、では、第${questionno+1}問、<voice name="Joanna"><lang xml:lang="en-US">${worddata[questionno].word}</lang></voice>、${worddata[questionno].word}の意味は何でしょう</amazon:domain></speak>`;
            respeakOutput = `<speak><amazon:domain name="conversational">もう一度、<voice name="Joanna"><lang xml:lang="en-US">${worddata[questionno].word}</lang></voice>、${worddata[questionno].word}の意味は何でしょう</amazon:domain></speak>`;
        }

        // APL対応デバイスの判定
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            console.log(`AnswerIntentHandler:getSupportedInterfaces ['Alexa.Presentation.APL']`);
            apl_data.myData.correcttext = correcttext.replace(/\n/g, '<br>');
            apl_directive.document = apl_document;
            apl_directive.datasources = apl_data;
            console.log(`apl_directive:isAPL ${JSON.stringify(apl_directive)}`);
            handlerInput.responseBuilder
              .addDirective(apl_directive)
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(respeakOutput)
            .getResponse();
    }
};

const AgainIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AgainIntent';
    },
    async handle(handlerInput) {
        console.log(`AgainIntentHandler`);
        let speakOutput = 'はい。';
        let respeakOutput = '';

        // セッション情報
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        console.log(`AgainIntentHandler:sessionAttributes ${JSON.stringify(sessionAttributes)}`);
        if (sessionAttributes.questionno === undefined) {
            console.log(`AgainIntentHandler:questionno ${questionno} false`);
            return LaunchRequestHandler.handle(handlerInput);
        }
        questionno = sessionAttributes.questionno;
        worddata = sessionAttributes.worddata;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        console.log(`AgainIntentHandler::worddata[${questionno}].word ${worddata[questionno].word} / wordid ${wordid}`);

        speakOutput = `<speak><amazon:domain name="conversational">${speakOutput}<voice name="Joanna"><lang xml:lang="en-US">Repeat again.</lang></voice>、では、第${questionno+1}問、<voice name="Joanna"><lang xml:lang="en-US">${worddata[questionno].word}</lang></voice>、${worddata[questionno].word}の意味は何でしょう</amazon:domain></speak>`;
        respeakOutput = `<speak><amazon:domain name="conversational">もう一度、<voice name="Joanna"><lang xml:lang="en-US">${worddata[questionno].word}</lang></voice>、${worddata[questionno].word}の意味は何でしょう</amazon:domain></speak>`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(respeakOutput)
            .getResponse();
    }
};

const SpellIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SpellIntent';
    },
    async handle(handlerInput) {
        console.log(`SpellIntentHandler`);
        let speakOutput = 'はい。';
        let respeakOutput = '';
        let spell = '';
        console.log(`SpellIntentHandler::worddata[${questionno}].word ${worddata[questionno].word}`);

        // セッション情報
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        console.log(`SpellIntentHandler:sessionAttributes ${JSON.stringify(sessionAttributes)}`);
        if (sessionAttributes.questionno === undefined) {
            console.log(`SpellIntentHandler:questionno ${questionno} false`);
            return LaunchRequestHandler.handle(handlerInput);
        }
        questionno = sessionAttributes.questionno;
        worddata = sessionAttributes.worddata;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        
        console.log(`SpellIntentHandler::word len ${worddata[questionno].word.length}`);
        for (let i = 0; i < worddata[questionno].word.length; i++) {
            spell = spell + worddata[questionno].word.charAt(i) + ','
        }
        console.log(`SpellIntentHandler::spell ${spell}`);

        speakOutput = `<speak><amazon:domain name="conversational">${speakOutput}<voice name="Joanna"><lang xml:lang="en-US">The spelling is <break time="1s"/> ${spell}.</lang></voice>、${worddata[questionno].word}の意味は何でしょう</amazon:domain></speak>`;
        respeakOutput = `<speak><amazon:domain name="conversational">もう一度、<voice name="Joanna"><lang xml:lang="en-US">${spell}</lang></voice>、${worddata[questionno].word}の意味は何でしょう</amazon:domain></speak>`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(respeakOutput)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    async handle(handlerInput) {
        console.log(`HelpIntentHandler`);
        let helptext = 'このスキルは、中学一年で習う英単語の意味を覚えるためのスキルです。スキルが英単語を言うので、意味を日本語で答えてください。もう一度言って。で、問題を繰り返します。また、スペルを言って。で、英単語のスペルを言います。';

        // セッション情報
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        console.log(`HelpIntentHandler:sessionAttributes ${JSON.stringify(sessionAttributes)}`);
        if (sessionAttributes.questionno) {
            // ワンショットじゃない
            questionno = sessionAttributes.questionno;
            worddata = sessionAttributes.worddata;
            console.log(`HelpIntentHandler:questionno ${questionno} true`);
            speakOutput = `<speak><amazon:domain name="conversational">${helptext}それでは、続けます。<voice name="Joanna"><lang xml:lang="en-US">Repeat again.</lang></voice>、では、第${questionno+1}問、<voice name="Joanna"><lang xml:lang="en-US">${worddata[questionno].word}</lang></voice>、${worddata[questionno].word}の意味は何でしょう</amazon:domain></speak>`;
            respeakOutput = `<speak><amazon:domain name="conversational">もう一度、<voice name="Joanna"><lang xml:lang="en-US">${worddata[questionno].word}</lang></voice>、${worddata[questionno].word}の意味は何でしょう</amazon:domain></speak>`;
        } else {
            // ワンショット
            sessionAttributes.questionno = 0;
            questionno = sessionAttributes.questionno;
            sessionAttributes.correct = 0;
            console.log(`HelpIntentHandler:questionno ${questionno} false`);

            // 情報読み出し
            worddata = await getGoogleSpreadSheetsValue(wordid);
            sessionAttributes.worddata = worddata;
            console.log(`HelpIntentHandler:worddata ${JSON.stringify(worddata)}`);
            console.log(`HelpIntentHandler:worddata[${questionno}] ${JSON.stringify(worddata[questionno])}`);
            if (worddata.id === 'ERROR') {
                return ErrorHandler.handle(handlerInput);
            }
            
            speakOutput = `<speak><amazon:domain name="conversational">${helptext}それでは、始めましょう！<voice name="Joanna"><lang xml:lang="en-US">Let\'s start!</lang></voice>、では、第${questionno+1}問、<voice name="Joanna"><lang xml:lang="en-US">${worddata[questionno].word}</lang></voice>、${worddata[questionno].word}の意味は何でしょう</amazon:domain></speak>`;
            respeakOutput = `<speak><amazon:domain name="conversational">もう一度、<voice name="Joanna"><lang xml:lang="en-US">${worddata[questionno].word}</lang></voice>、${worddata[questionno].word}の意味は何でしょう</amazon:domain></speak>`;
    
        }
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        console.log(`HelpIntentHandler:sessionAttributes ${JSON.stringify(sessionAttributes)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        console.log(`CancelAndStopIntentHandler`);
        let speakOutput = 'See you next time.';
        speakOutput = `<speak><amazon:domain name="conversational">わかりました。またね。<voice name="Joanna"><lang xml:lang="en-US">See you next time.</lang></voice></amazon:domain></speak>`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .withShouldEndSession(true)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`SessionEndedRequestHandler`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        console.log(`IntentReflectorHandler`);
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .withShouldEndSession(true)
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`ErrorHandler`);
        console.log(`~~~~ Error handled: ${error.stack}`);
        // const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;
        let speakOutput = `<speak><amazon:domain name="conversational">ごめんなさい。もう一度、試してみてください。<voice name="Joanna"><lang xml:lang="en-US">Sorry, I had trouble doing what you asked. Please try again.</lang></voice></amazon:domain></speak>`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .withShouldEndSession(true)
//            .reprompt(speakOutput)
            .getResponse();
    }
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        AnswerIntentHandler,
        AgainIntentHandler,
        SpellIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
        ) 
    .addErrorHandlers(
        ErrorHandler,
        )
    .lambda();
