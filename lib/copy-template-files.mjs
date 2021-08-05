import c from 'kleur';
import ora from 'ora';
import vm from 'vm';
import path from 'path';
import tmp from 'tmp';
import rimraf from 'rimraf';
import prompts from 'prompts';
import fs from 'fs-extra';
import rcp from 'recursive-copy';
import through from 'through2';
import { getProjectDirectory, debug, getConfigProp } from '@pinpt/cli/lib/util.mjs';
import { writeDirectoryFromGitHubToFs } from './github-api.mjs';

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
	const slug = getConfigProp('slug');
	const siteId = getConfigProp('siteId');
	let dir = await getProjectDirectory(slug);
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
	const s = ora(c.magenta('Copying template files...')).start();
	const data = {
		slug,
		siteId,
		dir,
	};
	const { name: from } = tmp.dirSync();
	try {
		await writeDirectoryFromGitHubToFs(from);
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
		const buf = fs.readFileSync(fn).toString();
		const script = new vm.Script(buf.toString(), { filename: fn });
		const context = { module: { exports: {} } };
		script.runInNewContext(context);
		context.module.exports.slug = slug;
		context.module.exports.siteId = siteId;
		if (options.host !== 'api.pinpoint.com') {
			context.module.exports.apihost = options.host;
		}
		fs.writeFileSync(fn, `module.exports = ${JSON.stringify(context.module.exports, null, 2)};`);
		s.succeed(c.bold('Copied template files...'));
	} finally {
		rimraf.sync(from, { recursive: true });
	}
};
