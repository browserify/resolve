var path = require('path');

module.exports = function (start, opts) {
    var modules = opts.moduleDirectory
        ? [].concat(opts.moduleDirectory)
        : ['node_modules']
    ;
    var prefix = '/';
    if (/^([A-Za-z]:)/.test(start)) {
        prefix = '';
    } else if (/^\\\\/.test(start)) {
        prefix = '\\\\';
    }
    var sep = process.platform === 'win32' ? '\\' : '/';

    // ensure that `start` is an absolute path at this point,
    // resolving against the process' current working directory
    start = path.resolve(start);

    var parts = start.split(sep);

    var dirs = [];
    for (var i = parts.length - 1; i >= 0; i--) {
        if (modules.indexOf(parts[i]) !== -1) continue;
        dirs = dirs.concat(modules.map(function(module_dir) {
            return prefix + path.join(
                parts.slice(0, i + 1).join(sep),
                module_dir
            );
        }));
    }
    return dirs.concat(opts.paths);
}
