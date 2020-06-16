const log = require("debug")("pastel");
const fs = require('fs');
const path = require('path');

const defaultMetadata = {
    'title': 'API Documentation',
    'language_tabs': [],
    'toc_footers': [
        "<a href='https://github.com/knuckleswtf/pastel'>Documentation powered by Pastel 🎨</a>",
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
        assetsFolder = __dirname + '/../resources';
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

const yamlFront = require('yaml-front-matter');
const yaml = yamlFront.loadFront(fs.readFileSync(sourceMarkdownFilePath, 'utf8'));

let content = yaml.__content;
let frontmatter = yaml;
delete frontmatter.__content;

const showdown  = require('showdown');
const converter = new showdown.Converter();
let html = converter.makeHtml(content);

let filePathsToInclude = [];

// Parse and include optional include markdown files
if (frontmatter.includes) {
    filePathsToInclude = frontmatter.includes
        .map(
            include => sourceFolder.replace(/\/$/g, '') + '/' + include.replace(/^\//g, '')
        );

    const glob = require("glob");
    filePathsToInclude.forEach((filePath) => {
        const fullPath = path.resolve(filePath);
        if (fullPath.includes('*')) {
            for (let file of glob.sync(fullPath))
            {
                if (!['.', '..'].includes(file)) {
                    html += converter.makeHtml(fs.readFileSync(file, 'utf8'));
                }
            }
        } else {
            if (!fs.existsSync(fullPath)) {
                console.log(`Include file ${fullPath} not found.`);
                return;
            }
            html += converter.makeHtml(fs.readFileSync(fullPath, 'utf8'));
        }
    });
}

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
    tools: {
        get_css_link_tag,
        get_image_tag,
        get_js_script_tag,
    }
});

if (!fs.existsSync(destinationFolder)) {
    fs.mkdirSync(destinationFolder, {recursive: true});
}

fs.writeFileSync(destinationFolder + '/index.html', output);

/*
// Copy assets
rcopy(assetsFolder + '/images/', destinationFolder + '/images');
rcopy(assetsFolder + '/css/', destinationFolder + '/css');
rcopy(assetsFolder + '/js/', destinationFolder + '/js');
rcopy(assetsFolder + '/fonts/', destinationFolder + '/fonts');

*/

console.log(`Generated documentation from ${sourceMarkdownFilePath} to ${destinationFolder}.`);
}

function getPageMetadata(frontmatter) {
    let metadata = defaultMetadata;

    // Override default with values from front matter
    metadata = Object.assign({}, metadata, frontmatter);
    return metadata;
}

function get_css_link_tag(name, media = '')
{
    return `<link rel="stylesheet" href="css/${name}.css" media="${media}" />`;
}

function get_js_script_tag(name)
{
    return `<script src="js/${name}.js"></script>`;
}

function get_image_tag(path, className = '')
{
    return `<img src="${path}" alt="${className}-image" class="${className}"/>`;
}

module.exports = generate;