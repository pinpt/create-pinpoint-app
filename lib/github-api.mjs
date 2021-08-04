import got from 'got';
import stream from 'stream';
import path from 'path';
import fs from 'fs-extra';
import { promisify } from 'util';
import { debug } from './util.mjs';

const repo = 'pinpt/app-template';

const pipeline = promisify(stream.pipeline);

let cachedLatestVersionCommit;

const getLatestVersionCommit = async () => {
	if (cachedLatestVersionCommit === undefined) {
		let commits = await got.get(`https://api.github.com/repos/${repo}/commits?per_page=1`).json();
		if (!commits.length) {
			throw new Error(
				'No commits that release pinpoint were found. Try updating create-pinpoint-app and if this problem persists, please open an issue on GitHub.'
			);
		}
		cachedLatestVersionCommit = commits[0].sha;
		debug(`using git commit ${cachedLatestVersionCommit} from ${repo}`);
	}
	return cachedLatestVersionCommit;
};

export const writeDirectoryFromGitHubToFs = async (dir) => {
	await fs.ensureDir(dir);
	const latestVersionCommit = await getLatestVersionCommit();
	const { tree } = await got(
		`https://api.github.com/repos/${repo}/git/trees/${latestVersionCommit}?recursive=1`
	).json();
	await Promise.all(
		tree.map(async (item) => {
			if (item.type === 'blob') {
				const fn = path.join(dir, item.path);
				await fs.ensureDir(path.dirname(fn));
				await pipeline(
					got.stream(`https://raw.githubusercontent.com/${repo}/${latestVersionCommit}/${item.path}`),
					fs.createWriteStream(fn)
				);
				debug(`copied ${fn}`);
			}
		})
	);
};
