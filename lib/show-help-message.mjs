import { getArgs, argsSpec } from './get-args.mjs';
import { runningFromYarn, runningFromNpx, showBanner } from './util.mjs';

export const showHelpMessage = () => {
	const [options] = getArgs();
	if (options.help) {
		showBanner();
		if (runningFromYarn()) {
			console.log(' Usage: yarn create pinpoint-app [options]');
		} else if (runningFromNpx()) {
			console.log(' Usage: npx create-pinpoint-app [options]');
		} else {
			console.log(' Usage: create-pinpoint-app [options]');
		}
		// TODO: options here
		console.log();
		console.log(' Options:');
		console.log();
		console.log(
			Object.keys(argsSpec)
				.filter((key) => !argsSpec[key].hidden)
				.map((key) => {
					const flag = argsSpec[key];
					const flagDefault = flag.default;
					const def = `${flagDefault ? `[default=${flagDefault}]` : ''}`;
					const prefix = flag.alias ? `-${flag.alias}, ` : '';
					const _flag = prefix + `--${key}`;
					return `   ${_flag.padEnd(25)} ${flag.description} ${def}`;
				})
				.join('\n')
		);
		console.log();
		process.exit(0);
	}
};
