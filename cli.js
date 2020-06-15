#!/usr/bin/env node

const arrayKeys = [
    'language_tabs',
    'toc_footers',
    'includes',
];

program
    .name('Scribe')
    .version('0.0.1')
    .command('generate <source> [destination]')
    .option('-m, --metadata <metadata>', "Override the values set in the frontmatter.", (metadata) => {
        let overrides = metadata.map(item => {
            let [key, value] = item.split('=');
            if (arrayKeys.includes(key)) {
                value = value.split(',');
            }
            overrides[key] = value;
            return overrides;
        })
    })
    .description("Generate HTML/CSS/JS documentation from a Markdown file or source folder  containing Markdown + assets..")
    .action(async (...args) => {
        require('index')(...args);
    });

program.parse(process.argv);