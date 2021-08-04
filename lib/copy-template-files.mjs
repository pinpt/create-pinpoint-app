import c from 'kleur';
import ora from 'ora';
import path from 'path';
import tmp from 'tmp';
import fs from 'fs-extra';
import rcp from 'recursive-copy';
import through from 'through2';
import { getSiteSlug } from './get-site-slug.mjs';
import { getProjectDirectory, debug } from './util.mjs';
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

export const copyAndFilterFiles = async () => {
	const s = ora(c.magenta('Copying template files...')).start();
	const slug = await getSiteSlug();
	const dir = await getProjectDirectory(slug);
	const data = {
		slug,
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
		fs.writeFileSync(fn, buf.replace(`'pinpoint'`, `'${slug}'`));
		s.succeed(c.bold('Copied template files...'));
	} finally {
		fs.rmdirSync(from, { recursive: true });
	}
};
