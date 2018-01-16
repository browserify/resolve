var test = require('tape');
var resolve = require('../');
var path = require('path');

test('shadowed core module names agree with require.resolve()', function (t) {
    t.plan(2);

    resolve('util', { basedir: path.join(__dirname, 'shadowed_core') }, function (err, res) {
        t.ifError(err);
        t.equal(res, 'util');
    });
});

test('shadowed core module names can be accessed with `name/`', function (t) {
    t.plan(2);

    resolve('util/', { basedir: path.join(__dirname, 'shadowed_core') }, function (err, res) {
        t.ifError(err);
        t.equal(res, path.join(__dirname, 'shadowed_core/node_modules/util/index.js'));
    });
});
