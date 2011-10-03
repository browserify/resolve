var assert = require('assert');
var resolve = require('../');

exports.mock = function () {
    var files = {
        '/foo/bar/baz.js' : 'beep'
    };
    
    function opts (basedir) {
        return {
            basedir : basedir,
            isFile : function (file) {
                return files.hasOwnProperty(file)
            },
            readFile : function (file) {
                return files[file]
            }
        }
    }
    
    assert.equal(
        resolve.sync('./baz', opts('/foo/bar')),
        '/foo/bar/baz.js'
    );
    
    assert.equal(
        resolve.sync('./baz.js', opts('/foo/bar')),
        '/foo/bar/baz.js'
    );
    
    assert.throws(function () {
        resolve.sync('baz', opts('/foo/bar'));
    });
};
