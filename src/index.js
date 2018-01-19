'use strict'
const http = require('http')

exports.handler = function (event, context) {
  try {
    let request = event.request
    let session = event.session
    if (!event.session.attributes) {
      event.session.attributes = {}
    }
    /*
      i)   LaunchRequest       Ex: "Start Jarvis/ open Jarvis"
      ii)  IntentRequest       Ex: "Say hello to John" or "ask jarvis to say hello to John"
      iii) SessionEndedRequest Ex: "exit/stop" or error or timeout
    */
    if (request.type === 'LaunchRequest') {
      handleLaunchRequest(context)
    } else if (request.type === 'IntentRequest') {
      if (request.intent.name === 'HelloIntent') {
        handleHelloIntent(request, context)
      } else if (request.intent.name === 'QuoteIntent') {
        handleQuoteIntent(request, context, session)
      } else if (request.intent.name === 'NextQuoteIntent') {
        handleNextQuoteIntent(request, context, session)
      } else if (request.intent.name === 'DrumIntent') {
        handleDrumIntent(request, context)
      } else if (request.intent.name === 'AMAZON.StopIntent' || request.intent.name === 'AMAZON.CancelIntent' || request.intent.name === 'AMAZON.NoIntent') {
        context.succeed(buildResponse({
          speechText: 'Ok Master. Good Bye.',
          endSession: true
        }))
      } else {
        throw new Error('Unknown intent')
      }
    } else if (request.type === 'SessionEndedRequest') {
      console.log('test')
    } else {
      throw new Error('Unknown intent type')
    }
  } catch (err) {
    context.fail('Exception: ' + err)
  }
  function getQuote (callback) {
    let url = 'http://api.forismatic.com/api/1.0/json?method=getQuote&lang=en&format=json'
    let req = http.get(url, function (res) {
      let body = ''
      res.on('data', function (chunk) {
        body += chunk
      })
      res.on('end', function () {
        body = body.replace(/\\/g, '')
        let quote = JSON.parse(body)
        callback(quote.quoteText)
      })
    })
    req.on('error', function (err) {
      callback(err)
    })
  }
  function getWish () {
    let myDate = new Date()
    let hours = myDate.getUTCHours() + 7
    if (hours < 0) {
      hours += 24
    }
    if (hours < 12) {
      return 'Good Morning. '
    } else if (hours < 18) {
      return 'Good Afternoon. '
    } else {
      return 'Good Evening. '
    }
  }
  function buildResponse (options) {
    let response = {
      version: '1.0',
      response: {
        outputSpeech: {
          type: 'SSML',
          ssml: '<speak>' + options.speechText + '</speak>'
        },
        shouldEndSession: options.endSession
      }
    }
    if (options.repromptText) {
      response.response.reprompt = {
        outputSpeech: {
          type: 'SSML',
          ssml: '<speak>' + options.repromptText + '</speak>'
        }
      }
    }
    if (options.session && options.session.attributes) {
      response.sessionAttributes = options.session.attributes
    }
    return response
  }
  function handleLaunchRequest (context) {
    let options = {
      speechText: 'Welcome Master. you can greet anyone or get a quote using Jarvis. What would you like Jarvis to do?',
      repromptText: 'You can say for example, say hello to Billy or get a quote',
      endSession: false
    }
    context.succeed(buildResponse(options))
  }
  function handleHelloIntent (request, context) {
    let options = {}
    let name = request.intent.slots.FirstName.value
    // options.speechText = `Hello <say-as interpret-as='spell-out'>${name}</say-as> ${name}. `
    options.speechText = `Hello ${name}. <audio src='https://s3.amazonaws.com/my-ssml-samples/Flourish.mp3'/> `
    options.speechText += getWish()
    getQuote(function (quote, err) {
      if (err) {
        context.fail(err)
      } else {
        options.speechText += ` Here is today's quote. <break time="2s"/> `
        options.speechText += quote
        options.endSession = true
        context.succeed(buildResponse(options))
      }
    })
  }
  function handleQuoteIntent (request, context, session) {
    let options = {}
    options.session = session
    getQuote(function (quote, err) {
      if (err) {
        context.fail(err)
      } else {
        options.speechText = quote
        options.speechText += ' Do you want to listen to one more quote? '
        options.repromptText = 'You can say yes or one more.'
        options.repromptText += 'or if you would like Jarvis to stop just say stop. '
        options.session.attributes.quoteIntent = true
        options.endSession = false
        context.succeed(buildResponse(options))
      }
    })
  }
  function handleNextQuoteIntent (request, context, session) {
    let options = {}
    options.session = session
    if (session.attributes.quoteIntent) {
      getQuote(function (quote, err) {
        if (err) {
          context.fail(err)
        } else {
          options.speechText = quote
          options.speechText += ' Do you want to listen to one more quote? '
          options.repromptText = 'You can say yes or one more. '
          options.repromptText += 'or if you would like Jarvis to stop just say stop. '
          // options.session.attributes.quoteIntent = true
          options.endSession = false
          context.succeed(buildResponse(options))
        }
      })
    } else {
      options.speechText = ' Sorry, Something went wrong. '
      options.endSession = true
      context.succeed(buildResponse(options))
    }
  }
  function handleDrumIntent (request, context) {
    let options = {}
    options.speechText = ' <audio src="https://s3.amazonaws.com/guruprice-alexa-assets/snare-drum-roll-long.mp3"/> '
    options.endSession = true
    context.succeed(buildResponse(options))
  }
}