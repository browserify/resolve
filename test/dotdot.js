var path = require('path');
var test = require('../lib/test-utils');
var resolve = require('../');

test('dotdot', function (t) {
    t.plan(4);
    var dir = __dirname + '/dotdot/abc';
    
    resolve('..', { basedir : dir }, function (err, res, pkg) {
        t.ifError(err);
        t.equalPaths(res, __dirname + '/dotdot/index.js');
    });
    
    resolve('.', { basedir : dir }, function (err, res, pkg) {
        t.ifError(err);
        t.equalPaths(res, dir + '/index.js');
    });
});

test('dotdot sync', function (t) {
    t.plan(2);
    var dir = __dirname + '/dotdot/abc';
    
    var a = resolve.sync('..', { basedir : dir });
    t.equalPaths(a, __dirname + '/dotdot/index.js');
    
    var b = resolve.sync('.', { basedir : dir });
    t.equalPaths(b, dir + '/index.js');
});
