var test = require('../lib/test-utils');
var resolve = require('../');

test('filter', function (t) {
    var dir = __dirname + '/resolver';
    var res = resolve.sync('./baz', {
        basedir : dir,
        packageFilter : function (pkg) {
            pkg.main = 'doom'
            return pkg;
        }
    });
    t.equalPaths(res, dir + '/baz/doom.js');
    t.end();
});
