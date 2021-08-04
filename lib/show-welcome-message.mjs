import CFonts from 'cfonts';

export const showWelcomeMessage = () => {
	CFonts.say('Pinpoint', {
		font: 'tiny',
		colors: ['#3830a3'],
		letterSpacing: 1,
		lineHeight: 1,
		space: true,
		maxLength: '0',
	});
	console.log("Answer a few short questions and we'll generate a project for you.\n");
};
