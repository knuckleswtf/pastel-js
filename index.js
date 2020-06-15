const log = require("debug")("pastel");
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

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

    if (!destinationFolder))

{
    // If no destination is supplied, place it in the source folder
    destinationFolder = sourceFolder;
}

const $document = yaml.safeLoadAll(fs.readFileSync(sourceMarkdownFilePath, 'utf8'));

let html = $document.getContent();
let frontmatter = $document.getYAML();

let filePathsToInclude = [];

// Parse and include optional include markdown files
if (frontmatter.includes) {
    filePathsToInclude = frontmatter.includes
        .map(
            include => sourceFolder.replace(/\/$/g, '') + '/' + include.replace(/^\//g, '')
        );
    filePathsToInclude.forEach(($filePath) => {
        if ($filePath.includes('*')) {
            foreach(glob($filePath) as $file)
            {
                if (!['.', '..'].includes(file)) {
                    html += $parser.parse(file_get_contents($file)).getContent();
                }
            }
        } else {
            $path = realpath($filePath);
            if ($path === false) {
                $this.output.warn("Include file $filePath not found.");
                return;
            }
            html += $parser.parse(file_get_contents($path)).getContent();
        }
    });
}

if (!frontmatter.last_updated) {
    // Set last_updated to most recent time main or include files was modified
    $timesLastUpdatedFiles = filePathsToInclude.map(function ($filePath) {
        $realPath = realpath($filePath);
        return $realPath ? filemtime($realPath) : 0;
    });
    $timesLastUpdatedFiles.push(filemtime(sourceMarkdownFilePath));
    frontmatter.last_updated = date("F j Y", $timesLastUpdatedFiles.max());
}

// Allow overriding options set in front matter from config
$metadata = getPageMetadata(frontmatter, $metadataOverrides);

$renderer = new BladeRenderer(
    [__DIR__ + '/../resources/views'],
    ['cache_path'
:
__DIR__.
'/_tmp'
]
)
;
$output = $renderer.render('index', [
    'page'
:
$metadata,
    'content'
:
html,
])
;

if (!is_dir(destinationFolder)) {
    mkdir(destinationFolder, 0777, true);
}

file_put_contents(destinationFolder + '/index.html', $output);

// Copy assets
rcopy(assetsFolder + '/images/', destinationFolder + '/images');
rcopy(assetsFolder + '/css/', destinationFolder + '/css');
rcopy(assetsFolder + '/js/', destinationFolder + '/js');
rcopy(assetsFolder + '/fonts/', destinationFolder + '/fonts');

console.log("Generated documentation from sourceMarkdownFilePath to destinationFolder.");
}

function getPageMetadata(frontmatter) {
    let metadata = defaultMetadata;

    // Override default with values from front matter
    metadata = Object.assign({}, metadata, frontmatter);
    return metadata;
}
