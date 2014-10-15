var path = require('path');
var test = require('../lib/test-utils');
var resolve = require('../');

test('mock', function (t) {
    t.plan(6);
    
    var files = {}
    files[path.resolve('/foo/bar/baz.js')] = 'beep';
    
    function opts (basedir) {
        return {
            basedir : path.resolve(basedir),
            isFile : function (file, cb) {
                cb(null, files.hasOwnProperty(path.resolve(file)));
            },
            readFile : function (file, cb) {
                cb(null, files[path.resolve(file)]);
            }
        }
    }
    
    resolve('./baz', opts('/foo/bar'), function (err, res, pkg) {
        if (err) t.fail(err);
        t.equalPaths(res, '/foo/bar/baz.js');
        t.equal(pkg, undefined);
    });
    
    resolve('./baz.js', opts('/foo/bar'), function (err, res, pkg) {
        if (err) t.fail(err);
        t.equalPaths(res, '/foo/bar/baz.js');
        t.equal(pkg, undefined);
    });
    
    resolve('baz', opts('/foo/bar'), function (err, res) {
        t.equalAlmost(err.message, "Cannot find module 'baz' from '/foo/bar'");
    });
    
    resolve('../baz', opts('/foo/bar'), function (err, res) {
        t.equalAlmost(err.message, "Cannot find module '../baz' from '/foo/bar'");
    });
});

test('mock from package', function (t) {
    t.plan(6);
    
    var files = {}
    files[path.resolve('/foo/bar/baz.js')] = 'beep';
    
    function opts (basedir) {
        return {
            basedir : path.resolve(basedir),
            package : { main: 'bar' },
            isFile : function (file, cb) {
                cb(null, files.hasOwnProperty(path.resolve(file)));
            },
            readFile : function (file, cb) {
                cb(null, files[path.resolve(file)]);
            }
        }
    }
    
    resolve('./baz', opts('/foo/bar'), function (err, res, pkg) {
        if (err) t.fail(err);
        t.equalPaths(res, '/foo/bar/baz.js');
        t.equal(pkg.main, 'bar');
    });
    
    resolve('./baz.js', opts('/foo/bar'), function (err, res, pkg) {
        if (err) t.fail(err);
        t.equalPaths(res, '/foo/bar/baz.js');
        t.equal(pkg.main, 'bar');
    });
    
    resolve('baz', opts('/foo/bar'), function (err, res) {
        t.equalAlmost(err.message, "Cannot find module 'baz' from '/foo/bar'");
    });
    
    resolve('../baz', opts('/foo/bar'), function (err, res) {
        t.equalAlmost(err.message, "Cannot find module '../baz' from '/foo/bar'");
    });
});

test('mock package', function (t) {
    t.plan(2);
    
    var files = {}
    files[path.resolve('/foo/node_modules/bar/baz.js')] = 'beep';
    files[path.resolve('/foo/node_modules/bar/package.json')] = JSON.stringify({
            main : './baz.js'
        });

    function opts (basedir) {
        return {
            basedir : path.resolve(basedir),
            isFile : function (file, cb) {
                cb(null, files.hasOwnProperty(path.resolve(file)));
            },
            readFile : function (file, cb) {
                cb(null, files[path.resolve(file)]);
            }
        }
    }
    
    resolve('bar', opts('/foo'), function (err, res, pkg) {
        if (err) t.fail(err);
        t.equalPaths(res, '/foo/node_modules/bar/baz.js');
        t.equal(pkg.main, './baz.js');
    });
});

test('mock package from package', function (t) {
    t.plan(2);
    
    var files = {}
    files[path.resolve('/foo/node_modules/bar/baz.js')] = 'beep';
    files[path.resolve('/foo/node_modules/bar/package.json')] = JSON.stringify({
            main : './baz.js'
        });
    
    function opts (basedir) {
        return {
            basedir : path.resolve(basedir),
            package : { main: 'bar' },
            isFile : function (file, cb) {
                cb(null, files.hasOwnProperty(path.resolve(file)));
            },
            readFile : function (file, cb) {
                cb(null, files[path.resolve(file)]);
            }
        }
    }
    
    resolve('bar', opts('/foo'), function (err, res, pkg) {
        if (err) t.fail(err);
        t.equalPaths(res, '/foo/node_modules/bar/baz.js');
        t.equal(pkg.main, './baz.js');
    });
});
