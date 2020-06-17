const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const generate = require('../index');

const outputDir = __dirname + '/output';

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

afterAll(() => {
    fs.rmdirSync(path.resolve(__dirname + '/output'), { recursive: true });
});


test('uses default metadata when frontmatter is missing', async () => {
    await generate(__dirname + '/files/test-no-front-matter.md', outputDir + '/no-front-matter');

    const source = fs.readFileSync(__dirname + '/output/no-front-matter/index.html', 'utf8');
    const $ = cheerio.load(source);

    const title = $('title')[0] || null;
    expect(title.children[0].data).toEqual(defaultMetadata.title);

    const searchInput = $('input').find((input) => input.attribs['id'] === "input-search");
    expect(searchInput).toBeTruthy();
});

test('can set last updated time automatically', async () => {
    const getDateString = (date = undefined) => {
        return new Intl.DateTimeFormat('en-US', {month: 'long', 'day': 'numeric', year: 'numeric'})
            .format(date);
    };
    const touch = (filePath, newTime = new Date()) => fs.utimesSync(path.resolve(filePath), newTime, newTime);

    // Update file modification time to today
    touch(__dirname + '/files/test-no-front-matter.md');
    let lastUpdated = getDateString();

    await generate(__dirname + '/files/test-no-front-matter.md', outputDir + '/no-front-matter');

    let source = fs.readFileSync(__dirname + '/output/no-front-matter/index.html', 'utf8');
    expect(source).toContain(`Last updated: ${lastUpdated}`);

    // Update file modification time to yesterday
    let yesterdaysTimestamp = Date.now() - (86400 * 1000);
    touch(__dirname + '/files/test-no-front-matter.md', new Date(yesterdaysTimestamp));
    lastUpdated = getDateString(new Date(yesterdaysTimestamp));

    await generate(__dirname + '/files/test-no-front-matter.md', outputDir + '/no-front-matter');

    source = fs.readFileSync(__dirname + '/output/no-front-matter/index.html', 'utf8');
    expect(source).toContain(`Last updated: ${lastUpdated}`);
});

test('uses frontmatter values properly', async () => {
    await generate(__dirname + '/files/test-with-front-matter.md', outputDir + '/with-front-matter');

    let source = fs.readFileSync(__dirname + '/output/with-front-matter/index.html', 'utf8');
    const $ = cheerio.load(source);

    const title = $('title')[0] || null;
    expect(title.children[0].data).toEqual("Test With Front Matter");

    const searchInput = $('input').find((input) => input.attribs['id'] === "input-search");
    expect(searchInput).toBeTruthy();

    const uls = $('ul').get();
    const tocFooter = uls.find(ul => ul.attribs['id'] === "toc-footer");
    expect(tocFooter).toBeTruthy();

    const li = tocFooter.children.find(node => {
        return node.type === 'tag';
    });
    const link = li.children[0];
    expect(link).toBeTruthy();
    expect(link.children[0].data).toEqual("Hey");

    const images = $('img').get();
    let logo = images.find(image => image.attribs['class'] === "logo");
    expect(logo).toBeUndefined();
});

test('include_file_contents_get_included', async () => {
    await generate(
        __dirname + '/files/test-with-includes.md',
        outputDir + '/with-includes'
    );

    let source = fs.readFileSync(__dirname + '/output/with-includes/index.html', 'utf8');

    const $ = cheerio.load(source);
    const header = $('h1').find(h1 => h1.nodeValue === "Include Me");

    expect(header).toBeTruthy();
    expect(source).toContain("Yay! I was included.");
});

test('can_include_entire_directory_in_alphabetical_order', async () => {
    await generate(
        __dirname + '/files/test-with-directory-include.md',
        outputDir + '/with-directory-include'
    );

    let source = fs.readFileSync(__dirname + '/output/with-directory-include/index.html', 'utf8');

    const $ = cheerio.load(source);

    const h1s = $('h1').get();
    const indexOfFirstOne = h1s.findIndex(h1 => h1.children[0].data === "Also Include Me");
    const indexOfSecondOne = h1s.findIndex(h1 => h1.children[0].data === "Include Me");

    expect(indexOfFirstOne).toBeTruthy();
    expect(indexOfSecondOne).toBeTruthy();
    expect(indexOfSecondOne).toBeGreaterThan(indexOfFirstOne);
});