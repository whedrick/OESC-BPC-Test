'use strict';

const _ = require('lodash');
const Script = require('smooch-bot').Script;

const scriptRules = require('./script.json');

module.exports = new Script({
    processing: {
        //prompt: (bot) => bot.say('Beep boop...'),
        receive: () => 'processing'
    },

    start: {
        receive: (bot) => {
            return bot.say("Hi!  Welcome to the Oklahoma Employment Security Commission (OESC) Automated Solution Chat (ASC)!  If you're having a problem, just ASC!")
                .then(() => 'initialHelp');
        }
    },
	
	initialHelp: { 
		prompt: (bot) => bot.say('I can help you with several things.  Please choose one of the following:	%[I would like to file a new claim](postback:file_new_claim) %[I received a letter about my claim](postback:received_letter) %[I would like to chat with a live person](postback:live_person) %[I would like a phone call from a representative](postback:phone_call)'), 
		receive: (bot, message) => { 
			const option = message.text; 
			if (message.text == "I would like to file a new claim") {
				return bot.say('You can file a new claim by visiting our website, https://unemployment.state.ok.us/')
					.then(() => 'speak'); 
			} else if (message.text == "I received a letter about my claim") {
				return bot.say('OK, let me gather some information so I can determine what the letter was about.')
					.then(() => 'askFirstName'); 
			} else if (message.text == "I would like to chat with a live person") {
				return bot.say('All of our representatives are currently helping other claimants.  Please be patient and one will be with you as quickly as possible.')
					.then(() => 'speak'); 
			} else if (message.text == "I would like a phone call from a representative") {
				return bot.say('All of our representatives are currently helping other claimants.  The current wait time for call back is approximately 17.78 hours.  Please be patient and the next available representative will call you.')
					.then(() => 'speak'); 
			} else {
				return bot.setProp('option', option)
					.then(() => bot.say(`I'm sorry, "${option}" is not a valid option.`))
					.then(() => 'initialHelp'); 
			}
		}
	}, 
	
	askFirstName: { 
		prompt: (bot) => bot.say('For the following questions, please provide the information exactly as it appears on your claim.\n\nWhat is your first name?'), 
		receive: (bot, message) => { 
			const firstName = message.text; 
			return bot.setProp('firstName', firstName) 
				.then(() => bot.say(`Great! I'll call you ${firstName}`))
				.then(() => 'askLastName'); 
		} 
	}, 
	
	askLastName: { 
		prompt: (bot) => bot.say('What is your last name?'), 
		receive: (bot, message) => { 
			const lastName = message.text; 
			return bot.setProp('lastName', lastName) 
				.then(() => bot.say(`Thank you! I understand your last name is ${lastName}`))
				.then(() => 'askSocial'); 
		} 
	}, 
	
	askSocial: { 
		prompt: (bot) => bot.say('What is your Social Security Number?'), 
		receive: (bot, message) => { 
			const social = message.text.replace(/[^0-9]/gi, "").substring(0,9);
			return bot.setProp('social', social) 
				.then(() => bot.say(`Thank you! I understand your SSN is `+social.substring(0,3)+"-"+social.substring(5,3)+"-"+social.substring(6,9)))
				.then(() => 'checkInfo'); 
		} 
	}, 

	checkInfo: {
		prompt: (bot) => bot.getProp('firstName')
			.then((firstName) => `First Name: ${firstName}\n`)
			.then((firstName) => bot.say(`${firstName}Last Name:`)),
			//.then(() => bot.getProp('lastName')), 
		receive: (bot, message) => { 
			return bot.say("Great!  Let me check your claim.")
			.then(() => 'speak');
		}
	},
	
    speak: {
        receive: (bot, message) => {

            let upperText = message.text.trim().toUpperCase();

            function updateSilent() {
                switch (upperText) {
                    case "CONNECT ME":
                        return bot.setProp("silent", true);
                    case "DISCONNECT":
                        return bot.setProp("silent", false);
                    default:
                        return Promise.resolve();
                }
            }

            function getSilent() {
                return bot.getProp("silent");
            }

            function processMessage(isSilent) {
                if (isSilent) {
                    return Promise.resolve("speak");
                }

                if (!_.has(scriptRules, upperText)) {
					if (upperText == "INITIALHELP") {
						return bot.say(`Restarting...`).then(() => 'initialHelp');
					}  else if (upperText == "CHECKINFO") {
						return bot.say(`Restarting...`).then(() => 'checkInfo');
					} else {
						return bot.say(`I didn't understand that.`).then(() => 'speak');
					}
                }

                var response = scriptRules[upperText];
                var lines = response.split('\n');

                var p = Promise.resolve();
                _.each(lines, function(line) {
                    line = line.trim();
                    p = p.then(function() {
                        console.log(line);
                        return bot.say(line);
                    });
                })
				
				return p.then(() => 'speak');
	        }

            return updateSilent()
                .then(getSilent)
                .then(processMessage);
        }
    }
});
