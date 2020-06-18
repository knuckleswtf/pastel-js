#!/usr/bin/env node

const VERSION = require('./package.json').version;
const program = require('commander');
program
    .name('Pastel')
    .version(VERSION)
    .command('generate <source> [destination]')
    .description("Generate HTML/CSS/JS documentation from a Markdown file or source folder  containing Markdown + assets.")
    .action(async (source, destination) => {
        require('./index').generate(source, destination);
    });

program.parse(process.argv);