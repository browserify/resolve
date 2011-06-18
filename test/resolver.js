var assert = require('assert');
var resolve = require('../');

exports.foo = function () {
    var dir = __dirname + '/resolver';
    
    assert.equal(
        resolve.sync('./foo', { basedir : dir }),
        dir + '/foo.js'
    );
    
    assert.equal(
        resolve.sync('./foo.js', { basedir : dir }),
        dir + '/foo.js'
    );
    
    assert.throws(function () {
        resolve.sync('foo', { basedir : dir });
    });
};

exports.bar = function () {
    var dir = __dirname + '/resolver';
    
    assert.equal(
        resolve.sync('foo', { basedir : dir + '/bar' }),
        dir + '/node_modules/foo/index.js'
    );
};
