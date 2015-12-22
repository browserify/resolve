var test = require('tape');
var path = require('path');
var resolve = require('../');

test('filter', function (t) {
    t.plan(2);
    var dir = __dirname + '/resolver';
    resolve('./baz', {
        basedir : dir,
        packageFilter : function (pkg) {
            pkg.main = 'doom';
            return pkg;
        }
    }, function (err, res, pkg) {
        if (err) t.fail(err);
        t.equal(res, path.join(dir, 'baz/doom.js'));
        t.equal(pkg.main, 'doom');
    });
});
