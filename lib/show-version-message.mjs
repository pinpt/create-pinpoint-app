import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import { getArgs } from './get-args.mjs';

export const showVersionMessage = () => {
	const [options] = getArgs();
	if (options.version) {
		const __dirname = path.dirname(fileURLToPath(import.meta.url));
		const fn = path.join(__dirname, '../package.json');
		if (fs.existsSync(fn)) {
			const pkg = JSON.parse(fs.readFileSync(fn));
			console.log(pkg.version);
		} else {
			console.log('unknown');
		}
		process.exit(0);
	}
};
