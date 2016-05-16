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
            return bot.say('Hi!  Welcome to the Oklahome Employment Security Commission (OESC) Automated Solution Chat (ASC)!  If you\'re having a problem, just ASC!')
                .then(() => 'askName');
        }
    },
	
	askName: { 
		prompt: (bot) => bot.say('For the following questions, please provide the information as it appears on your claim.\nWhat is your first name?'), 
		receive: (bot, message) => { 
			const firstName = message.text; 
			return bot.setProp('firstName', firstName)  
		} 
		prompt: (bot) => bot.say('What is your last name?'), 
		receive: (bot, message) => { 
			const lastName = message.text; 
			return bot.setProp('lastName', lastName) 
				.then(() => bot.say(`Great! I understand that your name is ${firstName} ${lastName}. I'll call you ${firstName}`))  
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
                    return bot.say(`I didn't understand that.`).then(() => 'speak');
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
