import { exec, tick, error, getProjectDirectory } from './util.mjs';
import { getArgs } from './get-args.mjs';
import { getSiteSlug } from './get-site-slug.mjs';

let runCmd = '';

export const getRunCmd = () => runCmd;

export const installProjectDependencies = async () => {
	const args = getArgs();
	if (args['dry-run']) {
		tick('Skipping install dependencies');
		return true;
	}

	const slug = await getSiteSlug();
	const dir = await getProjectDirectory(slug);

	if (!args['use-npm']) {
		const result = await exec(dir, 'yarn', 'Installing dependencies with yarn', true);
		if (result.failed && result.code === 'ENOENT') {
			// fall through
		} else {
			if (result.failed) {
				error('Error installing dependencies.', true);
			}
			runCmd = 'yarn dev';
			return true;
		}
	}
	const result = await exec(dir, 'npm install', 'Installing dependencies with npm');
	if (result.failed) {
		error('Error installing dependencies.', true);
	}
	runCmd = 'npm run dev';
	return true;
};
