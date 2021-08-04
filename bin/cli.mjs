#!/usr/bin/env node

import { showWelcomeMessage } from '../lib/show-welcome-message.mjs';
import { showSuccessMessage } from '../lib/show-success-message.mjs';
import { getSiteSlug } from '../lib/get-site-slug.mjs';
import { installProjectDependencies } from '../lib/install-project-dependencies.mjs';
import { copyAndFilterFiles } from '../lib/copy-template-files.mjs';

(async () => {
	showWelcomeMessage();
	await getSiteSlug();
	await copyAndFilterFiles();
	await installProjectDependencies();
	showSuccessMessage();
})();
