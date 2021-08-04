import { showBanner } from './util.mjs';

export const showWelcomeMessage = () => {
	showBanner();
	console.log("Answer a few short questions and we'll generate a project for you.\n");
};
