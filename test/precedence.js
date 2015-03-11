var path = require('path');
var test = require('tape');
var resolve = require('../');

test('precedence', function (t) {
    t.plan(2);
    var dir = path.join(__dirname, 'precedence/aaa');
    
    resolve('./', { basedir : dir }, function (err, res, pkg) {
        t.ifError(err);
        t.equal(res, path.join(dir, 'index.js'));
    });
});

test('./ should not load ${dir}.js', function (t) {
    t.plan(1);
    var dir = path.join(__dirname, 'precedence/bbb');
    
    resolve('./', { basedir : dir }, function (err, res, pkg) {
        t.ok(err);
    });
});
