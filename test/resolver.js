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
        dir + '/bar/node_modules/foo/index.js'
    );
};

exports.baz = function () {
    var dir = __dirname + '/resolver';
    
    assert.equal(
        resolve.sync('./baz', { basedir : dir }),
        dir + '/baz/quux.js'
    );
};

exports.biz = function () {
    var dir = __dirname + '/resolver/biz/node_modules';
    assert.equal(
        resolve.sync('./grux', { basedir : dir }),
        dir + '/grux/index.js'
    );
    
    assert.equal(
        resolve.sync('tiv', { basedir : dir + '/grux' }),
        dir + '/tiv/index.js'
    );
    
    assert.equal(
        resolve.sync('grux', { basedir : dir + '/tiv' }),
        dir + '/grux/index.js'
    );
};

exports.normalize = function () {
    var dir = __dirname + '/resolver/biz/node_modules/grux';
    assert.equal(
        resolve.sync('../grux', { basedir : dir }),
        dir + '/index.js'
    );
};

exports.cup = function () {
    var dir = __dirname + '/resolver';
    assert.equal(
        resolve.sync('./cup', {
            basedir : dir,
            extensions : [ '.js', '.coffee' ]
        }),
        dir + '/cup.coffee'
    );
    
    assert.equal(
        resolve.sync('./cup.coffee', {
            basedir : dir
        }),
        dir + '/cup.coffee'
    );
    
    assert.throws(function () {
        assert.equal(
            resolve.sync('./cup', {
                basedir : dir,
                extensions : [ '.js' ]
            }),
            dir + '/cup.coffee'
        );
    });
};

exports.mug = function () {
    var dir = __dirname + '/resolver';
    assert.equal(
        resolve.sync('./mug', { basedir : dir }),
        dir + '/mug.js'
    );
    
    assert.equal(
        resolve.sync('./mug', {
            basedir : dir,
            extensions : [ '.coffee', '.js' ]
        }),
        dir + '/mug.coffee'
    );
    
    assert.equal(
        resolve.sync('./mug', {
            basedir : dir,
            extensions : [ '.js', '.coffee' ]
        }),
        dir + '/mug.js'
    );
};
