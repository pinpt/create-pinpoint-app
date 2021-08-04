import arg from 'arg';
import path from 'path';

let ARGS = false;

export const getArgs = () => {
	if (ARGS) {
		return ARGS;
	}

	const argsSpec = {
		'--slug': String,
		'--help': Boolean,
		'--host': String,
		'--dry-run': Boolean,
		'--use-npm': Boolean,
		'--dir': String,
		'--debug': Boolean,
		'-h': '--help',
	};

	const defaults = {
		'--host': 'api.pinpoint.com',
		'--dir': path.resolve(process.cwd()),
		'--use-npm': false,
		'--dry-run': false,
		'--debug': false,
	};

	const _args = { ...defaults, ...arg(argsSpec, { permissive: true }) };

	ARGS = {};
	Object.keys(_args).forEach((key) => {
		const k = key.replace(/^--/, '');
		ARGS[k] = _args[key];
	});

	return ARGS;
};
