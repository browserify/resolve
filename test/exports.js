var path = require('path');
var test = require('tape');
var resolve = require('../');

test('exports', function (t) {
    t.plan(38);
    var dir = path.join(__dirname, '/exports');

    resolve('mix-conditionals', { basedir: dir, ignoreExportsField: false }, function (err, res, pkg) {
        t.notOk(res);
        t.equal(err && err.code, 'ERR_INVALID_PACKAGE_CONFIG');
        t.match(err && err.message, /"exports" cannot contain some keys starting with '.' and some not./);
    });

    resolve('invalid-config/with-node_modules', { basedir: dir, ignoreExportsField: false }, function (err, res, pkg) {
        t.notOk(res);
        t.equal(err && err.code, 'ERR_INVALID_PACKAGE_TARGET');
        t.match(err && err.message, /Invalid "exports" target "\.\/node_modules\/foo\/index\.js"/);
    });

    resolve('invalid-config/outside-package', { basedir: dir, ignoreExportsField: false }, function (err, res, pkg) {
        t.notOk(res);
        t.equal(err && err.code, 'ERR_INVALID_PACKAGE_TARGET');
        t.match(err && err.message, /Invalid "exports" target "\.\/\.\.\/mix-conditionals\/package\.json"/);
    });

    resolve('invalid-config/not-with-dot', { basedir: dir, ignoreExportsField: false }, function (err, res, pkg) {
        t.notOk(res);
        t.equal(err && err.code, 'ERR_INVALID_PACKAGE_TARGET');
        t.match(err && err.message, /Invalid "exports" target "package\.json"/);
    });

    resolve('invalid-config/numeric-key-1', { basedir: dir, ignoreExportsField: false }, function (err, res, pkg) {
        t.notOk(res);
        t.equal(err && err.code, 'ERR_INVALID_PACKAGE_CONFIG');
        t.match(err && err.message, /"exports" cannot contain numeric property keys/);
    });

    resolve('invalid-config/numeric-key-2', { basedir: dir, ignoreExportsField: false }, function (err, res, pkg) {
        t.notOk(res);
        t.equal(err && err.code, 'ERR_INVALID_PACKAGE_CONFIG');
        t.match(err && err.message, /"exports" cannot contain numeric property keys/);
    });

    resolve('valid-config', { basedir: dir, ignoreExportsField: false }, function (err, res, pkg) {
        t.ifError(err);
        t.equal(res, path.join(dir, 'node_modules/valid-config/exists.js'));
    });

    resolve('valid-config/package.json', { basedir: dir, ignoreExportsField: false }, function (err, res, pkg) {
        t.notOk(res);
        t.equal(err && err.code, 'ERR_PACKAGE_PATH_NOT_EXPORTED');
        t.match(err && err.message, /Package subpath \.\/package\.json is not defined by "exports" in/);
    });

    resolve('valid-config/remapped', { basedir: dir, ignoreExportsField: false }, function (err, res, pkg) {
        t.ifError(err);
        t.equal(res, path.join(dir, 'node_modules/valid-config/exists.js'));
    });

    resolve('valid-config/remapped/exists.js', { basedir: dir, ignoreExportsField: false }, function (err, res, pkg) {
        t.ifError(err);
        t.equal(res, path.join(dir, 'node_modules/valid-config/exists.js'));
    });

    resolve('valid-config/remapped/doesnt-exist.js', { basedir: dir, ignoreExportsField: false }, function (err, res, pkg) {
        t.notOk(res);
        t.equal(err && err.code, 'MODULE_NOT_FOUND');
        t.match(err && err.message, /Cannot find module 'valid-config\/remapped\/doesnt-exist\.js'/);
    });

    resolve('valid-config/array', { basedir: dir, ignoreExportsField: false }, function (err, res, pkg) {
        t.ifErr(err);
        t.equal(res, path.join(dir, 'node_modules/valid-config/exists.js'));
    });

    resolve('valid-config/with-env', { basedir: dir, ignoreExportsField: false }, function (err, res, pkg) {
        t.ifErr(err);
        t.equal(res, path.join(dir, 'node_modules/valid-config/with-env/require.js'));
    });

    function iterateWithoutModifyingSubpath(request, start, getNodeModulesDirs, opts) {
        return [path.join(opts.basedir, 'other_modules', request)];
    }
    resolve('other-module-dir', { basedir: dir, ignoreExportsField: false, packageIterator: iterateWithoutModifyingSubpath }, function (err, res, pkg) {
        t.ifErr(err);
        t.equal(res, path.join(dir, 'other_modules/other-module-dir/exported.js'));
    });

    function iterateModifyingSubpath(request, start, getNodeModulesDirs, opts) {
        return [path.join(opts.basedir, 'other_modules', request, 'index')];
    }
    resolve('other-module-dir', { basedir: dir, ignoreExportsField: false, packageIterator: iterateModifyingSubpath }, function (err, res, pkg) {
        t.ifErr(err);
        t.equal(res, path.join(dir, 'other_modules/other-module-dir/index.js'));
    });
});

test('exports sync', function (t) {
    var dir = path.join(__dirname, '/exports');

    try {
        resolve.sync('mix-conditionals', { basedir: dir, ignoreExportsField: false });
        t.fail();
    } catch (err) {
        t.equal(err.code, 'ERR_INVALID_PACKAGE_CONFIG');
        t.match(err.message, /"exports" cannot contain some keys starting with '.' and some not./);
    }

    try {
        resolve.sync('invalid-config/with-node_modules', { basedir: dir, ignoreExportsField: false });
        t.fail();
    } catch (err) {
        t.equal(err.code, 'ERR_INVALID_PACKAGE_TARGET');
        t.match(err.message, /Invalid "exports" target "\.\/node_modules\/foo\/index\.js"/);
    }

    try {
        resolve.sync('invalid-config/outside-package', { basedir: dir, ignoreExportsField: false });
        t.fail();
    } catch (err) {
        t.equal(err.code, 'ERR_INVALID_PACKAGE_TARGET');
        t.match(err.message, /Invalid "exports" target "\.\/\.\.\/mix-conditionals\/package\.json"/);
    }

    try {
        resolve.sync('invalid-config/not-with-dot', { basedir: dir, ignoreExportsField: false });
        t.fail();
    } catch (err) {
        t.equal(err.code, 'ERR_INVALID_PACKAGE_TARGET');
        t.match(err.message, /Invalid "exports" target "package\.json"/);
    }

    try {
        resolve.sync('invalid-config/numeric-key-1', { basedir: dir, ignoreExportsField: false });
        t.fail();
    } catch (err) {
        t.equal(err.code, 'ERR_INVALID_PACKAGE_CONFIG');
        t.match(err.message, /"exports" cannot contain numeric property keys/);
    }

    try {
        resolve.sync('invalid-config/numeric-key-2', { basedir: dir, ignoreExportsField: false });
        t.fail();
    } catch (err) {
        t.equal(err.code, 'ERR_INVALID_PACKAGE_CONFIG');
        t.match(err.message, /"exports" cannot contain numeric property keys/);
    }

    t.equal(resolve.sync('valid-config', { basedir: dir, ignoreExportsField: false }), path.join(dir, 'node_modules/valid-config/exists.js'));

    try {
        resolve.sync('valid-config/package.json', { basedir: dir, ignoreExportsField: false });
        t.fail();
    } catch (err) {
        t.equal(err.code, 'ERR_PACKAGE_PATH_NOT_EXPORTED');
        t.match(err.message, /Package subpath \.\/package\.json is not defined by "exports" in/);
    }

    t.equal(resolve.sync('valid-config/remapped', { basedir: dir, ignoreExportsField: false }), path.join(dir, 'node_modules/valid-config/exists.js'));

    t.equal(resolve.sync('valid-config/remapped/exists.js', { basedir: dir, ignoreExportsField: false }), path.join(dir, 'node_modules/valid-config/exists.js'));

    try {
        resolve.sync('valid-config/remapped/doesnt-exist.js', { basedir: dir, ignoreExportsField: false });
        t.fail();
    } catch (err) {
        t.equal(err.code, 'MODULE_NOT_FOUND');
        t.match(err.message, /Cannot find module 'valid-config\/remapped\/doesnt-exist\.js'/);
    }

    t.equal(
        resolve.sync('valid-config/array', { basedir: dir, ignoreExportsField: false }),
        path.join(dir, 'node_modules/valid-config/exists.js')
    );

    t.equal(
        resolve.sync('valid-config/with-env', { basedir: dir, ignoreExportsField: false }),
        path.join(dir, 'node_modules/valid-config/with-env/require.js')
    );

    function iterateWithoutModifyingSubpath(request, start, getNodeModulesDirs, opts) {
        return [path.join(opts.basedir, 'other_modules', request)];
    }
    t.equal(
        resolve.sync('other-module-dir', { basedir: dir, ignoreExportsField: false, packageIterator: iterateWithoutModifyingSubpath }),
        path.join(dir, 'other_modules/other-module-dir/exported.js')
    );

    function iterateModifyingSubpath(request, start, getNodeModulesDirs, opts) {
        return [path.join(opts.basedir, 'other_modules', request, 'index')];
    }
    t.equal(
        resolve.sync('other-module-dir', { basedir: dir, ignoreExportsField: false, packageIterator: iterateModifyingSubpath }),
        path.join(dir, 'other_modules/other-module-dir/index.js')
    );

    t.end();
});

