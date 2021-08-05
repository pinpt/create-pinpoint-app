import c from 'kleur';
import ora from 'ora';
import path from 'path';
import tmp from 'tmp';
import rimraf from 'rimraf';
import prompts from 'prompts';
import fs from 'fs-extra';
import rcp from 'recursive-copy';
import through from 'through2';
import { getProjectDirectory, debug, readPinpointConfig } from '@pinpt/cli/lib/util.mjs';
import { writeDirectoryFromGitHubToFs } from './github-api.mjs';
import { selectSite } from '@pinpt/cli/lib/signup.mjs';

// these are file extensions that are valid for template replacements
const validExtensions = ['ts', 'tsx', 'js', 'jsx', 'md', 'yaml', 'yml', 'json', 'css'];

const filterFile = (_buf, data) => {
	let buf = _buf;
	Object.keys(data).forEach((key) => {
		const r = new RegExp('__' + key.toUpperCase() + '__', 'g');
		if (r.test(buf)) {
			buf = buf.replace(r, data[key]);
		}
	});
	return buf;
};

export const copyAndFilterFiles = async ({ options }) => {
	const { id: siteId, slug } = await selectSite();
	// add to the options so we can use them in subsequent steps
	options.siteId = siteId;
	options.slug = slug;
	let dir = await getProjectDirectory(slug);
	// only confirm if we didn't pass in a specific --dir option
	if (path.resolve(options.dir) === process.cwd()) {
		const outdir = await prompts(
			{
				type: 'text',
				name: 'value',
				message: 'Confirm the output directory?',
				validate: (value) => fs.existsSync(value),
				initial: dir,
			},
			{
				onCancel: () => {
					process.exit(0);
				},
			}
		);
		dir = outdir.value;
	}
	const s = ora(c.magenta('Copying template files...')).start();
	const data = {
		slug,
		siteId,
		dir,
	};
	let from;
	let cleanup = false;
	try {
		if (options['template-dir']) {
			from = options['template-dir'];
			if (!fs.existsSync(from)) {
				throw new Error(`couldn't find template at ${from}`);
			}
			cleanup = false;
		} else {
			const { name: _from } = tmp.dirSync();
			from = _from;
			cleanup = true;
			await writeDirectoryFromGitHubToFs(from);
		}
		await rcp(from, dir, {
			dot: true,
			overwrite: true,
			filter: ['**/*', '!node_modules', '!.next', '!.git'],
			transform: (src) => {
				const ext = path.extname(src).substring(1);
				if (validExtensions.includes(ext)) {
					return through(function (chunk, enc, done) {
						debug(`filtering ${src}`);
						const out = filterFile(chunk.toString(), data);
						return done(null, out);
					});
				}
				return null;
			},
		});
		// write the slug, we don't use a normal template here because we want to be able to
		// load the repo directly if cloned or launched via the README
		const fn = path.join(dir, 'pinpoint.config.js');
		const config = readPinpointConfig(fn);
		config.slug = slug;
		config.siteId = siteId;
		if (options.host !== 'api.pinpoint.com') {
			config.apihost = options.host;
		}
		fs.writeFileSync(fn, `module.exports = ${JSON.stringify(config, null, 2)};`);
		s.succeed(c.bold('Copied template files...'));
	} finally {
		if (cleanup) {
			rimraf.sync(from, { recursive: true });
		}
	}
};
