var test = require('tap').test;
var resolve = require('../');

test('async foo', function (t) {
    t.plan(3);
    var dir = __dirname + '/resolver';
    
    resolve('./foo', { basedir : dir }, function (err, res) {
        if (err) t.fail(err);
        t.equal(res, dir + '/foo.js');
    });
    
    resolve('./foo.js', { basedir : dir }, function (err, res) {
        if (err) t.fail(err);
        t.equal(res, dir + '/foo.js');
    });
    
    resolve('foo', { basedir : dir }, function (err) {
        t.equal(err.message, "Cannot find module 'foo'");
    });
});
