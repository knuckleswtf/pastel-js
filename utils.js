
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


module.exports = {
    get_css_link_tag,
    get_image_tag,
    get_js_script_tag,
};