#!/usr/bin/env node

import path from 'path';
import { showWelcomeMessage } from '@pinpt/cli/lib/show-welcome-message.mjs';
import { showSuccessMessage } from '../lib/show-success-message.mjs';
import { installProjectDependencies } from '../lib/install-project-dependencies.mjs';
import { copyAndFilterFiles } from '../lib/copy-template-files.mjs';
import { showHelpMessage } from '@pinpt/cli/lib/show-help-message.mjs';
import { showVersionMessage } from '@pinpt/cli/lib/show-version-message.mjs';
import { init, error } from '@pinpt/cli/lib/util.mjs';
import { getArgs } from '@pinpt/cli/lib/args.mjs';

export const optionSpec = {
	slug: { type: String, description: 'The slug for your Pinpoint site' },
	help: { type: Boolean, description: 'This menu :/', alias: 'h', default: false },
	version: { type: Boolean, description: 'Print the version and exit', alias: 'v', default: false },
	host: { type: String, description: 'The api host', hidden: true, default: 'api.pinpoint.com' },
	'dry-run': { type: Boolean, description: `Run the command but don't actually do anything`, default: false },
	'use-npm': { type: Boolean, description: 'Use npm even if running from yarn', default: false },
	dir: {
		type: String,
		description: 'The output directory to generate your project into',
		default: path.resolve(process.cwd()),
	},
	'template-dir': {
		type: String,
		description: 'The template directory to generate your project from',
	},
	debug: { type: Boolean, description: 'Turn on verbose debug logging', default: false },
};

(async () => {
	try {
		const [options, args] = getArgs(optionSpec);
		const cmd = { args, options, optionSpec, meta: import.meta };
		init(cmd);
		await showVersionMessage(cmd);
		await showHelpMessage(cmd);
		await showWelcomeMessage();
		await copyAndFilterFiles(cmd);
		await installProjectDependencies(cmd);
		await showSuccessMessage(cmd);
	} catch (ex) {
		error(ex.message, true);
	}
})();
