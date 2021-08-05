import { exec, tick, error, getProjectDirectory, runningFromYarn, getConfigProp } from '@pinpt/cli/lib/util.mjs';

let runCmd = '';

export const getRunCmd = () => runCmd;

export const installProjectDependencies = async ({ options }) => {
	if (options['dry-run']) {
		tick('Skipping install dependencies');
		return true;
	}

	const slug = getConfigProp('slug');
	const dir = await getProjectDirectory(slug);
	const useYarn = runningFromYarn() && !options['use-npm'];

	// check to see if we're running from yarn and if so, use yarn as the default *unless* --use-npm is explicitly set
	if (useYarn) {
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
