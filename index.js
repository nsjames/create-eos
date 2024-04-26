import {exec, spawn} from 'child_process';
import * as prompt from '@clack/prompts';
import kleur from 'kleur';
import fs from 'fs';
import fetch from 'node-fetch';
import {rimrafSync} from 'rimraf';
import path from 'path';

const execAndForward = (command, options = {}) => {
    // const proc = exec(command, options)
    // proc.stdout.pipe(process.stdout);
    // proc.stderr.pipe(process.stderr);
    spawn(command, {shell: true, stdio: 'inherit', ...options});
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

// copilot stops working on bad words, boo
// so I'm doing this and injecting it below instead
const cli = 'fuckyea';

if(template) {
    prompt.outro(`Setting up your ${template} starter kit project in ${kleur.bold(cwd)}...`);
    execAndForward(`npx ${cli} starter ${template} ${cwd}`);
} else {


    const framework = await prompt.select({
        message: 'What frontend framework would you like to use?',
        options: [
            {
                label: 'SvelteKit',
                value: 'svelte'
            },
            {
                label: 'Next.js (React)',
                value: 'react'
            },
            {
                label: 'Nuxt.js (Vue)',
                value: 'vue'
            }
        ]
    });

    if (prompt.isCancel(framework)) process.exit(1);

    // create cwd/contracts
    fs.mkdirSync(path.join(cwd, 'contracts'), {recursive: true});
    fs.mkdirSync(path.join(cwd, 'ui'), {recursive: true});


    prompt.outro(`Setting up your project in ${kleur.bold(cwd)}...`);

    if(framework === 'svelte') {
        execAndForward(`npm create svelte@latest ./ui`, {cwd});
    } else if(framework === 'react') {
        execAndForward(`npx create-next-app@latest ./ui`, {cwd});
    } else if(framework === 'vue') {
        execAndForward(`npx nuxi@latest init ./ui`, {cwd: path.join(cwd, 'ui')});
    }

    execAndForward(`npx ${cli} create .`, {cwd: path.join(cwd, 'contracts')});
}


