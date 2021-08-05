import c from 'kleur';
import path from 'path';
import terminalLink from 'terminal-link';
import { getProjectDirectory } from '@pinpt/cli/lib/util.mjs';
import { getRunCmd } from './install-project-dependencies.mjs';

export const showSuccessMessage = async ({ options }) => {
	const { slug } = options;
	const projectDir = await getProjectDirectory(slug);
	console.log(`
  🎉  Pinpoint created a project in: ${c.bold(projectDir)}
  
  ${c.bold('To launch your app, run:')}

  - cd ${projectDir}
  - ${getRunCmd()}

  ${c.bold('Next steps:')}

  - ${terminalLink('View your app', 'http://localhost:3000')}
  - Edit ${c.bold(`${projectDir}${path.sep}pages/app.js`)} to customize your app.
  - ${terminalLink('Visit the Dashboard', 'https://home.pinpoint.com')}
  - Deploy to Pinpoint by running ${c.bold('npm run deploy')}
`);
};
