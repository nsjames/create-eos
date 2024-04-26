#!/usr/bin/env node
import {exec} from 'child_process';
import * as prompt from '@clack/prompts';
import kleur from 'kleur';
import fs from 'fs';
import fetch from 'node-fetch';
import {rimrafSync} from 'rimraf';

const execAndForward = (command) => {
    const proc = exec(command, {stdio: 'inherit'})
    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);
}

let cwd = process.argv[2] || '.';

prompt.intro(`Welcome to EOS!`);

if (cwd === '.') {
    const dir = await prompt.text({
        message: 'Where should we create your project?',
        placeholder: '  (hit Enter to use current directory)'
    });

    if (prompt.isCancel(dir)) process.exit(1);

    if (dir) {
        cwd = /** @type {string} */ (dir);
    }
}

if (fs.existsSync(cwd)) {
    const force = await prompt.confirm({
        message: kleur.bold().red().underline(`Directory "${cwd}" already exists, and will be deleted. Continue?`),
        initialValue: false
    });

    if (force !== true) {
        process.exit(1);
    }

    rimrafSync(cwd);
}

const useTemplate = await prompt.select({
    message: 'Do you want to use a template?',
    options: [
        {
            hint: 'Start with a blank project',
            label: 'No',
            value: false,
        },
        {
            hint: 'Choose a template from the list to start with',
            label: 'Yes',
            value: true
        }
    ]
});

let template = null;
if(useTemplate){
    const templates = await fetch('https://api.github.com/repos/eosnetworkfoundation/template-projects/contents').then(res => res.json()).catch(err => console.error(err));
    const templateNames = templates.filter(x => x.type === 'dir').map(x => x.name);

    template = await prompt.select({
        message: 'Choose a template to start with',
        options: templateNames.map(x => ({value: x}))
    });
}


if(template) {
    prompt.outro(`Setting up your ${template} starter kit project in ${kleur.bold(cwd)}...`);
    execAndForward(`npx fuckyea starter ${template} ${cwd}`);
} else {
    prompt.outro(`Setting up your project in ${kleur.bold(cwd)}...`);
    execAndForward(`npx fuckyea create ${cwd}`);
}


