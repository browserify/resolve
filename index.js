var fs = require('fs');
var path = require('path');

// http://nodejs.org/docs/v0.4.8/api/all.html#all_Together...

var core = exports.core = [
    'assert', 'buffer', 'child_process', 'crypto', 'dgram', 'dns', 'events',
    'fs', 'http', 'https', 'net', 'os', 'path', 'querystring', 'readline', 'repl', 'stream',
    'sys', 'tls', 'tty', 'url', 'util', 'vm'
].reduce(function (acc, x) { acc[x] = true; return acc }, {});

exports.isCore = function (x) { return core[x] };

exports.sync = function (x, opts) {
    if (core[x]) return x;
    
    if (!opts) opts = {};
    var isFile = opts.isFile || function (file) {
        return path.existsSync(file) && fs.statSync(file).isFile()
    };
    var readFileSync = opts.readFileSync || fs.readFileSync;
    
    var extensions = opts.extensions || [ '.js' ];
    var y = opts.basedir
        || path.dirname(require.cache[__filename].parent.filename)
    ;

    opts.paths = opts.paths || [];

    if (x.match(/^(?:\.\.?\/|\/|([A-Za-z]:)?\\)/)) {
        var m = loadAsFileSync(path.resolve(y, x))
            || loadAsDirectorySync(path.resolve(y, x));
        if (m) return m;
    }
    
    var n = loadNodeModulesSync(x, y);
    if (n) return n;
    
    throw new Error("Cannot find module '" + x + "'");
    
    function loadAsFileSync (x) {
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
    
    function loadAsDirectorySync (x) {
        var pkgfile = x + '/package.json';
        if (isFile(pkgfile)) {
            var body = readFileSync(pkgfile, 'utf8');
            try {
                var pkg = JSON.parse(body);
                if (opts.packageFilter) {
                    pkg = opts.packageFilter(pkg);
                }
                
                if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            catch (err) {}
        }
        
        return loadAsFileSync(x + '/index');
    }
    
    function loadNodeModulesSync (x, start) {
        var dirs = nodeModulesPathsSync(start);
        for (var i = 0; i < dirs.length; i++) {
            var dir = dirs[i];
            var m = loadAsFileSync(dir + '/' + x);
            if (m) return m;
            var n = loadAsDirectorySync(dir + '/' + x);
            if (n) return n;
        }
    }
    
    function nodeModulesPathsSync (start) {
        var parts = start.split(/\/+/);
        
        var dirs = [];
        for (var i = parts.length - 1; i >= 0; i--) {
            if (parts[i] === 'node_modules') continue;
            var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
            dirs.push(dir);
        }
        return opts.paths.concat(dirs);
    }
};
