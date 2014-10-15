var path = require('path');
var test = require('../lib/test-utils');
var resolve = require('../');

test('mock', function (t) {
    t.plan(4);
    
    var files = {}
    files[path.resolve('/foo/bar/baz.js')] = 'beep';
    
    function opts (basedir) {
        return {
            basedir : path.resolve(basedir),
            isFile : function (file) {
                return files.hasOwnProperty(path.resolve(file))
            },
            readFileSync : function (file) {
                return files[path.resolve(file)]
            }
        }
    }
    
    t.equalPaths(
        resolve.sync('./baz', opts('/foo/bar')),
        '/foo/bar/baz.js'
    );
    
    t.equalPaths(
        resolve.sync('./baz.js', opts('/foo/bar')),
        '/foo/bar/baz.js'
    );
    
    t.throws(function () {
        resolve.sync('baz', opts('/foo/bar'));
    });

    t.throws(function () {
        resolve.sync('../baz', opts('/foo/bar'));
    });
});

test('mock package', function (t) {
    t.plan(1);
    
    var files = {}
    files[path.resolve('/foo/node_modules/bar/baz.js')] = 'beep';
    files[path.resolve('/foo/node_modules/bar/package.json')] = JSON.stringify({
            main : './baz.js'
        });
    
    function opts (basedir) {
        return {
            basedir : path.resolve(basedir),
            isFile : function (file) {
                return files.hasOwnProperty(path.resolve(file))
            },
            readFileSync : function (file) {
                return files[path.resolve(file)]
            }
        }
    }
    
    t.equalPaths(
        resolve.sync('bar', opts('/foo')),
        '/foo/node_modules/bar/baz.js'
    );
});
