const log = require("debug")("pastel");
const fs = require('fs');
const path = require('path');
const showdown = require('showdown');
const converter = new showdown.Converter();

const defaultMetadata = {
    'title': 'API Documentation',
    'language_tabs': [],
    'toc_footers': [
        "<a href='https://github.com/knuckleswtf/pastel-js'>Documentation powered by Pastel 🎨</a>",
    ],
    'logo': false,
    'includes': [],
    'last_updated': '',
};

/**
 * Generate the API documentation using the markdown and include files
 */
async function generate(sourceFolder, destinationFolder = '') {
    let assetsFolder = '';
    let sourceMarkdownFilePath = '';

    if (sourceFolder.endsWith('.md')) {
        // We're given just the path to a file, we'll use default assets
        sourceMarkdownFilePath = sourceFolder;
        sourceFolder = path.dirname(sourceMarkdownFilePath);
        assetsFolder = __dirname + '/resources';
    } else {
        if (!is_dir(sourceFolder)) {
            throw new InvalidArgumentException(`Source folder ${sourceFolder} is not a directory.`);
        }

        // Valid source directory
        sourceMarkdownFilePath = sourceFolder + '/index.md';
        assetsFolder = sourceFolder;
    }

    if (!destinationFolder) {
        // If no destination is supplied, place it in the source folder
        destinationFolder = sourceFolder;
    }
    let {frontmatter, converter, html} = getFrontMatterAndMainHtml(sourceMarkdownFilePath);

    let filePathsToInclude = (frontmatter.includes || []).map(
                include => path.resolve(sourceFolder.replace(/\/$/g, '') + '/' + include.replace(/^\//g, ''))
            );
    html += includeSpecifiedMarkdownFiles(filePathsToInclude, html, converter);

    if (!frontmatter.last_updated) {
        // Set last_updated to most recent time main or include files was modified
        const timesLastUpdatedFiles = filePathsToInclude.map(function (filePath) {
            const realPath = path.resolve(filePath);
            try {
                return fs.statSync(realPath).mtime;
            } catch (e) {
                // If we encounter a nonexistent file
                return 0;
            }
        });
        timesLastUpdatedFiles.push(fs.statSync(sourceMarkdownFilePath).mtime);
        frontmatter.last_updated = new Date(Math.max(...timesLastUpdatedFiles));
    }

    const metadata = getPageMetadata(frontmatter);

    const ejs = require('ejs');
    const output = ejs.render(fs.readFileSync(path.join(__dirname, 'resources/views/index.ejs'), 'utf8'), {
        page: metadata,
        content: html,
        tools: require('./utils'),
    });

    if (!fs.existsSync(destinationFolder)) {
        fs.mkdirSync(destinationFolder, {recursive: true});
    }

    fs.writeFileSync(destinationFolder + '/index.html', output);

    await copyAssets(assetsFolder, destinationFolder);

    console.log(`Generated documentation from ${sourceMarkdownFilePath} to ${destinationFolder}.`);
}

function getFrontMatterAndMainHtml(sourceMarkdownFilePath) {
    const yamlFront = require('yaml-front-matter');
    const yaml = yamlFront.loadFront(fs.readFileSync(sourceMarkdownFilePath, 'utf8'));

    let content = yaml.__content;
    let frontmatter = yaml;
    delete frontmatter.__content;

    let html = converter.makeHtml(content);
    return {frontmatter, converter, html};
}

function getPageMetadata(frontmatter) {
    let metadata = defaultMetadata;

    // Override default with values from front matter
    metadata = Object.assign({}, metadata, frontmatter);
    return metadata;
}

function includeSpecifiedMarkdownFiles(filePathsToInclude) {
    let extraContent = '';
    const glob = require("glob");

    filePathsToInclude.forEach((filePath) => {
        if (filePath.includes('*')) {
            for (let file of glob.sync(filePath)) {
                extraContent += converter.makeHtml(fs.readFileSync(file, 'utf8'));
            }
        } else {
            if (!fs.existsSync(filePath)) {
                console.log(`Include file ${filePath} not found.`);
                return;
            }
            extraContent += converter.makeHtml(fs.readFileSync(filePath, 'utf8'));
        }
    });
    return extraContent;
}

async function copyAssets(assetsFolder, destinationFolder) {
    const ncp = require('ncp').ncp;
    const ncp2 = require('util').promisify(ncp);

    try {
        await ncp2(assetsFolder + '/images/', destinationFolder + '/images');
        await ncp2(assetsFolder + '/css/', destinationFolder + '/css');
        await ncp2(assetsFolder + '/js/', destinationFolder + '/js');
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

module.exports = generate;