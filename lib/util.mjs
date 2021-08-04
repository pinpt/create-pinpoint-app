import ora from 'ora';
import execa from 'execa';
import path from 'path';
import fs from 'fs';
import { getArgs } from './get-args.mjs';
import c from 'kleur';

export const tick = (message) => {
	var isWin = process.platform === 'win32';
	console.log((isWin ? c.green('√ ') : c.green('✔ ')) + c.bold(message));
};

const args = getArgs();

export const debug = args.debug
	? (message) => {
			console.log(c.gray(message));
	  }
	: () => null;

export const error = (message, fail = false) => {
	console.error(c.red('Error: ') + c.bold(message));
	if (fail) {
		process.exit(1);
	}
};

export const getProjectDirectory = async (slug) => {
	const args = await getArgs();
	const dir = path.resolve(path.join(args.dir, slug));
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	return dir;
};

// execute a child process in the new project directory
export const exec = async (cwd, cmd, msg, silent = false) => {
	debug(`running ${cmd} in ${cwd}`);
	let result = false;
	const spinner = ora({ text: c.magenta(msg), discardStdin: true, interval: 80 });
	spinner.start();
	try {
		result = execa.commandSync(cmd, {
			cwd,
		});
		spinner.succeed(c.bold(msg));
	} catch (error) {
		if (!silent) {
			spinner.fail(error.message);
		}
		result = error;
	}
	return result;
};
