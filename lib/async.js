/* eslint-disable max-lines */
var fs = require('fs');
var path = require('path');
var caller = require('./caller');
var nodeModulesPaths = require('./node-modules-paths');
var normalizeOptions = require('./normalize-options');
var isCore = require('is-core-module');
var resolveExports = require('./resolve-imports-exports');

var realpathFS = fs.realpath && typeof fs.realpath.native === 'function' ? fs.realpath.native : fs.realpath;

var defaultIsFile = function isFile(file, cb) {
    fs.stat(file, function (err, stat) {
        if (!err) {
            return cb(null, stat.isFile() || stat.isFIFO());
        }
        if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return cb(null, false);
        return cb(err);
    });
};

var defaultIsDir = function isDirectory(dir, cb) {
    fs.stat(dir, function (err, stat) {
        if (!err) {
            return cb(null, stat.isDirectory());
        }
        if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return cb(null, false);
        return cb(err);
    });
};

var defaultRealpath = function realpath(x, cb) {
    realpathFS(x, function (realpathErr, realPath) {
        if (realpathErr && realpathErr.code !== 'ENOENT') cb(realpathErr);
        else cb(null, realpathErr ? x : realPath);
    });
};

var maybeRealpath = function maybeRealpath(realpath, x, opts, cb) {
    if (opts && opts.preserveSymlinks === false) {
        realpath(x, cb);
    } else {
        cb(null, x);
    }
};

var getPackageCandidates = function getPackageCandidates(x, start, opts) {
    var dirs = nodeModulesPaths(start, opts, x);
    for (var i = 0; i < dirs.length; i++) {
        dirs[i] = path.join(dirs[i], x);
    }
    return dirs;
};

module.exports = function resolve(x, options, callback) {
    var cb = callback;
    var opts = options;
    if (typeof options === 'function') {
        cb = opts;
        opts = {};
    }
    if (typeof x !== 'string') {
        var err = new TypeError('Path must be a string.');
        return process.nextTick(function () {
            cb(err);
        });
    }

    opts = normalizeOptions(x, opts);

    var isFile = opts.isFile || defaultIsFile;
    var isDirectory = opts.isDirectory || defaultIsDir;
    var readFile = opts.readFile || fs.readFile;
    var realpath = opts.realpath || defaultRealpath;
    var packageIterator = opts.packageIterator;

    var extensions = opts.extensions || ['.js'];
    var includeCoreModules = opts.includeCoreModules !== false;
    var basedir = opts.basedir || path.dirname(caller());
    var parent = opts.filename || basedir;

    if (opts.exportsField == null) {
        opts.exportsField = 'ignore';
    } else if (opts.exportsField !== 'respect' && opts.exportsField !== 'ignore') {
        throw new TypeError('Invalid value for exportsField: ' + opts.exportsField);
    }

    var conditions = opts.exportsField === 'respect' ? ['require', 'node'] : [];

    opts.paths = opts.paths || [];

    // ensure that `basedir` is an absolute path at this point, resolving against the process' current working directory
    var absoluteStart = path.resolve(basedir);

    maybeRealpath(
        realpath,
        absoluteStart,
        opts,
        function (err, realStart) {
            if (err) cb(err);
            else init(realStart);
        }
    );

    var res;
    function init(basedir) {
        if ((/^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[/\\])/).test(x)) {
            res = path.resolve(basedir, x);
            if (x === '.' || x === '..' || x.slice(-1) === '/') res += '/';
            if ((/\/$/).test(x) && res === basedir) {
                loadAsDirectory(res, opts.package, onfile);
            } else loadAsFile(res, opts.package, onfile);
        } else if (includeCoreModules && isCore(x)) {
            return cb(null, x);
        } else loadNodeModules(x, basedir, function (err, n, pkg) {
            if (err) cb(err);
            else if (n) {
                return maybeRealpath(realpath, n, opts, function (err, realN) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, realN, pkg);
                    }
                });
            } else {
                var moduleError = new Error("Cannot find module '" + x + "' from '" + parent + "'");
                moduleError.code = 'MODULE_NOT_FOUND';
                cb(moduleError);
            }
        });
    }

    function onfile(err, m, pkg) {
        if (err) cb(err);
        else if (m) cb(null, m, pkg);
        else loadAsDirectory(res, function (err, d, pkg) {
            if (err) cb(err);
            else if (d) {
                maybeRealpath(realpath, d, opts, function (err, realD) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, realD, pkg);
                    }
                });
            } else {
                var moduleError = new Error("Cannot find module '" + x + "' from '" + parent + "'");
                moduleError.code = 'MODULE_NOT_FOUND';
                cb(moduleError);
            }
        });
    }

    function loadAsFile(x, thePackage, callback) {
        var loadAsFilePackage = thePackage;
        var cb = callback;
        if (typeof loadAsFilePackage === 'function') {
            cb = loadAsFilePackage;
            loadAsFilePackage = undefined;
        }

        var exts = [''].concat(extensions);
        load(exts, x, loadAsFilePackage);

        function load(exts, x, loadPackage) {
            if (exts.length === 0) return cb(null, undefined, loadPackage);
            var file = x + exts[0];

            var pkg = loadPackage;
            if (pkg) onpkg(null, pkg);
            else loadpkg(path.dirname(file), onpkg);

            function onpkg(err, pkg_, dir) {
                pkg = pkg_;
                if (err) return cb(err);
                if (dir && pkg && opts.pathFilter) {
                    var rfile = path.relative(dir, file);
                    var rel = rfile.slice(0, rfile.length - exts[0].length);
                    var r = opts.pathFilter(pkg, x, rel);
                    if (r) return load(
                        [''].concat(extensions.slice()),
                        path.resolve(dir, r),
                        pkg
                    );
                }
                isFile(file, onex);
            }
            function onex(err, ex) {
                if (err) return cb(err);
                if (ex) return cb(null, file, pkg);
                load(exts.slice(1), x, pkg);
            }
        }
    }

    function loadpkg(dir, cb) {
        if (dir === '' || dir === '/') return cb(null);
        if (process.platform === 'win32' && (/^\w:[/\\]*$/).test(dir)) {
            return cb(null);
        }
        if ((/[/\\]node_modules[/\\]*$/).test(dir)) return cb(null);

        maybeRealpath(realpath, dir, opts, function (unwrapErr, pkgdir) {
            if (unwrapErr) return loadpkg(path.dirname(dir), cb);
            var pkgfile = path.join(pkgdir, 'package.json');
            isFile(pkgfile, function (err, ex) {
                // on err, ex is false
                if (!ex) return loadpkg(path.dirname(dir), cb);

                readFile(pkgfile, function (err, body) {
                    if (err) cb(err);
                    try { var pkg = JSON.parse(body); } catch (jsonErr) {}

                    if (pkg && opts.packageFilter) {
                        pkg = opts.packageFilter(pkg, pkgfile);
                    }
                    cb(null, pkg, dir);
                });
            });
        });
    }

    function loadAsDirectory(x, loadAsDirectoryPackage, callback) {
        var cb = callback;
        var fpkg = loadAsDirectoryPackage;
        if (typeof fpkg === 'function') {
            cb = fpkg;
            fpkg = opts.package;
        }

        maybeRealpath(realpath, x, opts, function (unwrapErr, pkgdir) {
            if (unwrapErr) return cb(unwrapErr);
            var pkgfile = path.join(pkgdir, 'package.json');
            isFile(pkgfile, function (err, ex) {
                if (err) return cb(err);
                if (!ex) return loadAsFile(path.join(x, 'index'), fpkg, cb);

                readFile(pkgfile, function (err, body) {
                    if (err) return cb(err);
                    try {
                        var pkg = JSON.parse(body);
                    } catch (jsonErr) {}

                    if (pkg && opts.packageFilter) {
                        pkg = opts.packageFilter(pkg, pkgfile);
                    }

                    if (pkg && pkg.main) {
                        if (typeof pkg.main !== 'string') {
                            var mainError = new TypeError('package “' + pkg.name + '” `main` must be a string');
                            mainError.code = 'INVALID_PACKAGE_MAIN';
                            return cb(mainError);
                        }
                        if (pkg.main === '.' || pkg.main === './') {
                            pkg.main = 'index';
                        }
                        loadAsFile(path.resolve(x, pkg.main), pkg, function (err, m, pkg) {
                            if (err) return cb(err);
                            if (m) return cb(null, m, pkg);
                            if (!pkg) return loadAsFile(path.join(x, 'index'), pkg, cb);

                            var dir = path.resolve(x, pkg.main);
                            loadAsDirectory(dir, pkg, function (err, n, pkg) {
                                if (err) return cb(err);
                                if (n) return cb(null, n, pkg);
                                loadAsFile(path.join(x, 'index'), pkg, cb);
                            });
                        });
                        return;
                    }

                    loadAsFile(path.join(x, '/index'), pkg, cb);
                });
            });
        });
    }

    function loadManifestInDir(dir, cb) {
        maybeRealpath(realpath, dir, opts, function (err, pkgdir) {
            if (err) return cb(null);

            var pkgfile = path.join(pkgdir, 'package.json');
            isFile(pkgfile, function (err, ex) {
                // on err, ex is false
                if (!ex) return cb(null);

                readFile(pkgfile, function (err, body) {
                    if (err) cb(err);
                    try { var pkg = JSON.parse(body); } catch (jsonErr) {}

                    if (pkg && opts.packageFilter) {
                        pkg = opts.packageFilter(pkg, pkgfile, dir);
                    }
                    cb(pkg);
                });
            });
        });
    }

    function processDirs(cb, dirs, subpath) {
        if (dirs.length === 0) return cb(null, undefined);
        var dir = dirs[0];

        if (opts.exportsField !== 'ignore' && endsWithSubpath(dir, subpath)) {
            var pkgDir = dir.slice(0, dir.length - subpath.length);
            loadManifestInDir(pkgDir, onmanifestWithExports);
        } else {
            onmanifest(false);
        }

        function onmanifestWithExports(pkg) {
            if (!pkg || pkg.exports == null) {
                return onmanifest(false);
            }

            var resolvedExport;
            try {
                resolvedExport = resolveExports(pkgDir, parent, subpath, pkg.exports, conditions);
            } catch (resolveErr) {
                return cb(resolveErr);
            }

            if (resolvedExport.exact) {
                isFile(resolvedExport.resolved, function (err, ex) {
                    if (ex) {
                        cb(null, resolvedExport.resolved, pkg);
                    } else {
                        cb(null, undefined);
                    }
                });
            } else {
                dir = resolvedExport.resolved;
                onmanifest(true);
            }
        }

        function onmanifest(stop) {
            isDirectory(path.dirname(dir), isdir);

            function isdir(err, isdir) {
                if (err) return cb(err);
                if (!isdir) return next();
                loadAsFile(dir, opts.package, onfile);
            }

            function onfile(err, m, pkg) {
                if (err) return cb(err);
                if (m) return cb(null, m, pkg);
                loadAsDirectory(dir, opts.package, ondir);
            }

            function ondir(err, n, pkg) {
                if (err) return cb(err);
                if (n) return cb(null, n, pkg);
                next();
            }

            function next() {
                if (stop) {
                    cb(null, undefined);
                } else {
                    processDirs(cb, dirs.slice(1), subpath);
                }
            }
        }
    }

    function loadNodeModules(x, start, cb) {
        var subpathIndex = x.charAt(0) === '@' ? x.indexOf('/', x.indexOf('/') + 1) : x.indexOf('/');
        var subpath = subpathIndex === -1 ? '' : x.slice(subpathIndex);

        var thunk = function () { return getPackageCandidates(x, start, opts); };

        processDirs(
            cb,
            packageIterator ? packageIterator(x, start, thunk, opts) : thunk(),
            subpath
        );
    }

    function endsWithSubpath(dir, subpath) {
        var endOfDir = dir.slice(dir.length - subpath.length);

        return endOfDir === subpath || endOfDir.replace(/\\/g, '/') === subpath;
    }
};
