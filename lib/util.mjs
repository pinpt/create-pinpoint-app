import CFonts from 'cfonts';
import ora from 'ora';
import execa from 'execa';
import path from 'path';
import os from 'os';
import fs from 'fs';
import got from 'got';
import terminalLink from 'terminal-link';
import si from 'systeminformation';
import c from 'kleur';
import { getArgs } from './get-args.mjs';

export const tick = (message) => {
	var isWin = process.platform === 'win32';
	console.log((isWin ? c.green('√ ') : c.green('✔ ')) + c.bold(message));
};

const [options] = getArgs();

export const debug = options.debug
	? (message) => {
			console.log(c.gray(`🏴‍☠️  ${message}`));
	  }
	: () => null;

export const error = (message, fail = false) => {
	console.error(c.red('Error: ') + c.bold(message));
	if (fail) {
		process.exit(1);
	}
};

export const getProjectDirectory = async (slug) => {
	const [options] = await getArgs();
	const dir = path.resolve(path.join(options.dir, slug));
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

export const runningFromYarn = () => {
	return process.env.npm_config_user_agent?.includes('yarn') === true;
};

export const runningFromNpx = () => {
	return process.env._?.includes('npx') === true;
};

export const showBanner = () => {
	CFonts.say('Pinpoint', {
		font: 'tiny',
		colors: ['#3830a3'],
		letterSpacing: 1,
		lineHeight: 1,
		space: true,
		maxLength: '0',
	});
	console.log(' ' + terminalLink(c.bold('https://pinpoint.com'), 'https://pinpoint.com'));
	console.log();
};

let CONFIG = false;

const configFileName = path.resolve(os.homedir(), '.pinpoint.json');

export const getConfig = () => {
	if (CONFIG) {
		return CONFIG;
	}
	if (fs.existsSync(configFileName)) {
		const o = JSON.parse(fs.readFileSync(configFileName));
		CONFIG = o;
		return CONFIG;
	}
	return null;
};

export const saveAPIKey = (value, expires) => {
	const c = getConfig() ?? {};
	c.apikey = { value, expires };
	CONFIG = c;
	fs.writeFileSync(configFileName, JSON.stringify(c, null, 2));
	fs.chmodSync(configFileName, '600');
};

export const getConfigProp = (key) => {
	const c = getConfig() ?? {};
	return c[key];
};

export const saveConfigProps = (props) => {
	const c = { ...(getConfig() ?? {}), ...props };
	CONFIG = c;
	fs.writeFileSync(configFileName, JSON.stringify(c, null, 2));
	fs.chmodSync(configFileName, '600');
};

export const getAPIKey = () => {
	const config = getConfig();
	if (config?.apikey) {
		const { value, expires } = config.apikey;
		if (expires > Date.now()) {
			// if it expires in the future, return it
			return value;
		}
	}
	return null;
};

let IP = false;

const ipAddress = async () => {
	if (IP) {
		return IP;
	}
	IP = await got.get(`https://api.ipify.org?format=json`, { responseType: 'json' }).then((res) => res.body.ip);
	return IP;
};

let MACHINE = false;

const formatManufacturer = (manufacturer) => {
	switch (manufacturer) {
		case 'Apple Inc.': {
			return 'Apple';
		}
		default:
			break;
	}
	return manufacturer;
};

const getSystemInfo = async () => {
	if (MACHINE) {
		return MACHINE;
	}
	MACHINE = si.system().then((data) => `${formatManufacturer(data.manufacturer)} ${data.model}`);
	return MACHINE;
};

export const apiRequest = async (help, basepath, params) => {
	const { body = null, method = 'POST', failOnError = true, apiKey } = params;
	const spinner = ora({ text: c.magenta(help), discardStdin: true, interval: 80 });
	spinner.start(help);
	const _apiKey = apiKey ?? getAPIKey();
	const headers = {};
	const [ip, machine] = await Promise.all([ipAddress(), getSystemInfo()]);
	if (_apiKey) {
		headers['Authorization'] = `Bearer ${_apiKey}`;
	}
	headers['x-pinpoint-ip'] = ip;
	headers['x-pinpoint-machine'] = machine;
	const url = `https://${options.host}${basepath}`;
	if (body) {
		headers['Content-Type'] = 'application/json';
	}
	const _method = body ? method : 'GET';
	debug(`requesting ${_method} ${url}`);
	try {
		const res = await got(url, {
			headers,
			method: _method,
			responseType: 'json',
			body: body ? JSON.stringify(body) : undefined,
			throwHttpErrors: false,
		});
		debug(`responded ${_method} ${url} ${JSON.stringify(res.body)}`);
		if (res.body?.success) {
			spinner.succeed(c.bold(help));
			return res.body;
		}
		spinner.fail(res.message ?? 'Internal Server Error');
		if (failOnError) {
			process.exit(1);
		}
		throw new Error(res.message ?? 'Internal Server Error');
	} catch (err) {
		spinner.fail(err.message);
		if (failOnError) {
			process.exit(1);
		} else {
			throw err;
		}
	}
};
