var isCore = require('./is-core');
var fs = require('fs');
var path = require('path');
var caller = require('./caller.js');
var nodeModulesPaths = require('./node-modules-paths.js');
var normalizeOptions = require('./normalize-options.js');

var defaultIsFile = function isFile(file) {
    try {
        var stat = fs.statSync(file);
    } catch (e) {
        if (e && (e.code === 'ENOENT' || e.code === 'ENOTDIR')) return false;
        throw e;
    }
    return stat.isFile() || stat.isFIFO();
};

var defaultIsDir = function isDirectory(dir) {
    try {
        var stat = fs.statSync(dir);
    } catch (e) {
        if (e && (e.code === 'ENOENT' || e.code === 'ENOTDIR')) return false;
        throw e;
    }
    return stat.isDirectory();
};

var maybeUnwrapSymlink = function maybeUnwrapSymlink(x, opts) {
    if (!opts || !opts.preserveSymlinks) {
        try {
            return fs.realpathSync(x);
        } catch (realPathErr) {
            if (realPathErr.code !== 'ENOENT') {
                throw realPathErr;
            }
        }
    }
    return x;
};

var getPackageCandidates = function getPackageCandidates(x, start, opts) {
    var dirs = nodeModulesPaths(start, opts, x);
    for (var i = 0; i < dirs.length; i++) {
        dirs[i] = path.join(dirs[i], x);
    }
    return dirs;
};

module.exports = function resolveSync(x, options) {
    if (typeof x !== 'string') {
        throw new TypeError('Path must be a string.');
    }
    var opts = normalizeOptions(x, options);

    var isFile = opts.isFile || defaultIsFile;
    var isDirectory = opts.isDirectory || defaultIsDir;
    var readFileSync = opts.readFileSync || fs.readFileSync;
    var packageIterator = opts.packageIterator;

    var extensions = opts.extensions || ['.js'];
    var basedir = opts.basedir || path.dirname(caller());
    var parent = opts.filename || basedir;

    opts.paths = opts.paths || [];

    // ensure that `basedir` is an absolute path at this point, resolving against the process' current working directory
    var absoluteStart = maybeUnwrapSymlink(path.resolve(basedir), opts);

    if (opts.basedir && !isDirectory(absoluteStart)) {
        var dirError = new TypeError('Provided basedir "' + opts.basedir + '" is not a directory' + (opts.preserveSymlinks ? '' : ', or a symlink to a directory'));
        dirError.code = 'INVALID_BASEDIR';
        throw dirError;
    }

    if ((/^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[/\\])/).test(x)) {
        var res = path.resolve(absoluteStart, x);
        if (x === '..' || x.slice(-1) === '/') res += '/';
        var m = loadAsFileSync(res) || loadAsDirectorySync(res);
        if (m) return maybeUnwrapSymlink(m, opts);
    } else if (isCore(x)) {
        return x;
    } else {
        var n = loadNodeModulesSync(x, absoluteStart);
        if (n) return maybeUnwrapSymlink(n, opts);
    }

    var err = new Error("Cannot find module '" + x + "' from '" + parent + "'");
    err.code = 'MODULE_NOT_FOUND';
    throw err;

    function loadAsFileSync(x) {
        var pkg = loadpkg(path.dirname(x));

        if (pkg && pkg.dir && pkg.pkg && opts.pathFilter) {
            var rfile = path.relative(pkg.dir, x);
            var r = opts.pathFilter(pkg.pkg, x, rfile);
            if (r) {
                x = path.resolve(pkg.dir, r); // eslint-disable-line no-param-reassign
            }
        }

        if (isFile(x)) {
            return x;
        }

        for (var i = 0; i < extensions.length; i++) {
            var file = x + extensions[i];
            if (isFile(file)) {
                return file;
            }
        }
    }

    function loadpkg(dir) {
        if (dir === '' || dir === '/') return;
        if (process.platform === 'win32' && (/^\w:[/\\]*$/).test(dir)) {
            return;
        }
        if ((/[/\\]node_modules[/\\]*$/).test(dir)) return;

        var pkgfile = path.join(isDirectory(dir) ? maybeUnwrapSymlink(dir, opts) : dir, 'package.json');

        if (!isFile(pkgfile)) {
            return loadpkg(path.dirname(dir));
        }

        var body = readFileSync(pkgfile);

        try {
            var pkg = JSON.parse(body);
        } catch (jsonErr) {}

        if (pkg && opts.packageFilter) {
            pkg = opts.packageFilter(pkg, pkgfile, dir);
        }

        return { pkg: pkg, dir: dir };
    }

    function loadAsDirectorySync(x) {
        var pkgfile = path.join(isDirectory(x) ? maybeUnwrapSymlink(x, opts) : x, '/package.json');
        if (isFile(pkgfile)) {
            try {
                var body = readFileSync(pkgfile, 'UTF8');
                var pkg = JSON.parse(body);
            } catch (e) {}

            if (pkg && opts.packageFilter) {
                pkg = opts.packageFilter(pkg, pkgfile, x);
            }

            if (pkg && pkg.main) {
                if (typeof pkg.main !== 'string') {
                    var mainError = new TypeError('package “' + pkg.name + '” `main` must be a string');
                    mainError.code = 'INVALID_PACKAGE_MAIN';
                    throw mainError;
                }
                if (pkg.main === '.' || pkg.main === './') {
                    pkg.main = 'index';
                }
                try {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                    var n = loadAsDirectorySync(path.resolve(x, pkg.main));
                    if (n) return n;
                } catch (e) {}
            }
        }

        return loadAsFileSync(path.join(x, '/index'));
    }

    function loadNodeModulesSync(x, start) {
        var thunk = function () { return getPackageCandidates(x, start, opts); };
        var dirs = packageIterator ? packageIterator(x, start, thunk, opts) : thunk();

        for (var i = 0; i < dirs.length; i++) {
            var dir = dirs[i];
            if (isDirectory(path.dirname(dir))) {
                var m = loadAsFileSync(dir);
                if (m) return m;
                var n = loadAsDirectorySync(dir);
                if (n) return n;
            }
        }
    }
};
