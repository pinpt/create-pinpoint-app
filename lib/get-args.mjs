import arg from 'arg';
import path from 'path';

let OPTIONS = false;
let ARGS = [];

export const argsSpec = {
	slug: { type: String, description: 'The slug for your Pinpoint site' },
	help: { type: Boolean, description: 'This menu :/', alias: 'h', default: false },
	version: { type: Boolean, description: 'Print the version and exit', alias: 'v', default: false },
	host: { type: String, description: 'The api host', hidden: true, default: 'api.pinpoint.com' },
	'dry-run': { type: Boolean, description: `Run the command but don't actually do anything`, default: false },
	'use-npm': { type: Boolean, description: 'Use npm even if running from yarn', default: false },
	dir: {
		type: String,
		description: 'The output folder to generate your project into',
		default: path.resolve(process.cwd()),
	},
	debug: { type: Boolean, description: 'Turn on verbose debug logging', default: false },
};

export const getArgs = () => {
	if (OPTIONS) {
		return [OPTIONS, ARGS];
	}

	const _args = {};
	Object.keys(argsSpec).forEach((key) => {
		const spec = argsSpec[key];
		_args[`--${key}`] = spec.type;
		if (spec.alias) {
			_args[`-${spec.alias}`] = `--${key}`;
		}
	});

	const res = arg(_args, { permissive: true });

	ARGS = res._;
	OPTIONS = {};

	Object.keys(argsSpec).forEach((key) => {
		const spec = argsSpec[key];
		OPTIONS[key] = res[`--${key}`] ?? res[`-${spec.alias}`] ?? spec.default;
	});

	// console.log({ OPTIONS, ARGS, _args, res });

	return [OPTIONS, ARGS];
};
