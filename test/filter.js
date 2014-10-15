var test = require('../lib/test-utils');
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
        t.equalPaths(res, dir + '/baz/doom.js');
        t.equalPaths(pkg.main, 'doom');
    });
});
