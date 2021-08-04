import prompts from 'prompts';
import c from 'kleur';
import { getAPIKey, saveConfigProps, saveAPIKey, apiRequest, debug, error } from './util.mjs';

export const getSignup = async () => {
	const apikey = getAPIKey();
	if (apikey) {
		try {
			await apiRequest('Verifying your credentials', '/auth/ping', { failOnError: false });
			debug('we already have a valid and unexpired apikey');
			return; // succeeded
		} catch (ex) {
			console.error(ex);
			// ignore if failed, as that means it's not authorized, invalid, etc
		}
	}

	const account = await prompts(
		{
			type: 'confirm',
			name: 'value',
			message: 'Do you already have a Pinpoint account?',
			initial: true,
		},
		{
			onCancel: () => {
				process.exit(0);
			},
		}
	);

	const email = await prompts(
		{
			type: 'text',
			name: 'value',
			message: 'What is your email address?',
			validate: (email) => {
				var re =
					/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
				return re.test(email);
			},
		},
		{
			onCancel: () => {
				process.exit(0);
			},
		}
	);

	if (account.value) {
		// we have an account we so we need to login instead of signup
		const res = await apiRequest('Verifying your account', '/user/signup', {
			body: {
				user: { email: email.value },
				site: { slug: '' },
				offline: true,
			},
		});
		const { userId, sites, slug, siteId, loginToken } = res;
		let _siteId = siteId;
		let _slug = slug;
		if (sites.length > 0) {
			const site = await prompts(
				{
					type: 'select',
					name: 'value',
					message: 'Please pick the site you want to use:',
					choices: sites.map(({ slug, name }) => ({ title: slug, description: name })),
				},
				{
					onCancel: () => {
						process.exit(0);
					},
				}
			);
			_siteId = sites[site.value].id;
			_slug = sites[site.value].slug;
		}
		console.log(
			c.magenta('We sent you an email at ') + c.magenta(c.bold(email.value)) + c.magenta(' to verify your account.')
		);
		while (true) {
			const code = await prompts(
				{
					type: 'text',
					name: 'value',
					message: 'Please enter the code from the email:',
					validate: (value) => value.length,
				},
				{
					onCancel: () => {
						process.exit(0);
					},
				}
			);
			try {
				await apiRequest('Verifying the code', '/user/signup/code', {
					body: { email: email.value, code: code.value, siteId: _siteId },
					method: 'PUT',
					apiKey: loginToken,
				});
				break;
			} catch (ex) {
				error('Invalid code supplied. Please try again', false);
			}
		}
		const ok = await prompts(
			{
				type: 'confirm',
				name: 'value',
				message: 'Save login information on this machine for 30 days?',
				initial: true,
			},
			{
				onCancel: () => {
					process.exit(0);
				},
			}
		);
		if (ok.value) {
			// save it
			saveAPIKey(loginToken, Date.now() + 2.592e9 - 40000);
			saveConfigProps({ userId, siteId: _siteId, slug: _slug });
		}
	}
};
