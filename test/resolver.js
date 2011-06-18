var assert = require('assert');
var resolve = require('../');

exports.foo = function () {
    var dir = __dirname + '/resolver';
    
    assert.equal(
        resolve.sync('./foo', { path : dir }),
        dir + '/foo.js'
    );
    
    assert.equal(
        resolve.sync('./foo.js', { path : dir }),
        dir + '/foo.js'
    );
    
    assert.throws(function () {
        resolve.sync('foo', { path : dir });
    });
};

exports.bar = function () {
    var dir = __dirname + '/resolver';
    
    assert.equal(
        resolve.sync('foo', { path : dir + '/bar' }),
        dir + '/node_modules/foo/index.js'
    );
};
