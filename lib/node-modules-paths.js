var path = require('path');


module.exports = function (start, opts) {
    var modules = opts.moduleDirectory || 'node_modules';
    var splitRe = process.platform === 'win32' ? /[\/\\]/ : /\/+/;
    var parts = start.split(splitRe);

    var dirs = [];
    for (var i = parts.length - 1; i >= 0; i--) {
        if (parts[i] === modules) continue;
        var dir = path.join(
            path.join.apply(path, parts.slice(0, i + 1)),
            modules
        );
        if (!parts[0].match(/([A-Za-z]:)/)) {
            dir = '/' + dir;
        }
        dirs.push(dir);
    }
    return dirs.concat(opts.paths);
}