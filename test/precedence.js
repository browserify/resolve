var path = require('path');
var test = require('tap').test;
var resolve = require('../');

test('precedence', function (t) {
    t.plan(3);
    var dir = path.join(__dirname, 'precedence/aaa');
    
    resolve('./', { basedir : dir }, function (err, res, pkg) {
        t.ifError(err);
        t.equal(res, path.join(dir, 'index.js'));
        t.equal(pkg, undefined);
    });
});
