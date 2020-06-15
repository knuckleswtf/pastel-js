#!/usr/bin/env node

const program = require('commander');
program
    .name('Scribe')
    .version('0.0.1')
    .command('generate <source> [destination]')
    .description("Generate HTML/CSS/JS documentation from a Markdown file or source folder  containing Markdown + assets..")
    .action(async (source, destination) => {
        require('index')(source, destination);
    });

program.parse(process.argv);