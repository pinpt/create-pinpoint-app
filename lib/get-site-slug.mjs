import prompts from 'prompts';
import { getArgs } from './get-args.mjs';

let SITE_SLUG = null;

export const getSiteSlug = async () => {
	// If we already have the project name return it
	if (SITE_SLUG) {
		return SITE_SLUG;
	}

	// If the project name was provided via the CLI arguments
	const args = getArgs();
	if (args['--slug']) {
		SITE_SLUG = args['--slug'];
		return SITE_SLUG;
	}

	let response = await prompts(
		{
			type: 'confirm',
			name: 'account',
			message: 'Do you already have a Pinpoint account?',
			initial: true,
		},
		{
			onCancel: () => {
				process.exit(0);
			},
		}
	);

	if (!response.account) {
		response = await prompts(
			{
				type: 'text',
				name: 'email',
				message: 'What is your email address?',
				validate: (value) => value.length, // FIXME: validate email
			},
			{
				onCancel: () => {
					process.exit(0);
				},
			}
		);
		// TODO: hit email to verify the account and provide a token and collect token and verify
	}

	response = await prompts(
		{
			type: 'text',
			name: 'value',
			message: 'What is your site slug?',
			validate: (value) => value.length,
		},
		{
			onCancel: () => {
				process.exit(0);
			},
		}
	);

	// Set a global variable to avoid prompting twice
	SITE_SLUG = response.value;
	return SITE_SLUG;
};
