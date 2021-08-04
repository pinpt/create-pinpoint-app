#!/usr/bin/env node

import { showWelcomeMessage } from '../lib/show-welcome-message.mjs';
import { showSuccessMessage } from '../lib/show-success-message.mjs';
import { installProjectDependencies } from '../lib/install-project-dependencies.mjs';
import { copyAndFilterFiles } from '../lib/copy-template-files.mjs';
import { showHelpMessage } from '../lib/show-help-message.mjs';
import { showVersionMessage } from '../lib/show-version-message.mjs';
import { getSignup } from '../lib/signup.mjs';

(async () => {
	await showHelpMessage();
	await showVersionMessage();
	await showWelcomeMessage();
	await getSignup();
	await copyAndFilterFiles();
	await installProjectDependencies();
	await showSuccessMessage();
})();
