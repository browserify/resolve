var path = require('path');
var test = require('tape');
var resolve = require('../');

test('exports (disabled)', function (t) {
    t.plan(34);
    var dir = path.join(__dirname, '/exports');

    resolve('mix-conditionals', { basedir: dir, ignoreExportsField: true }, function (err, res, pkg) {
        t.ifErr(err);
        t.equal(res, path.join(dir, 'node_modules/mix-conditionals/index.js'));
    });

    resolve('invalid-config/with-node_modules', { basedir: dir, ignoreExportsField: true }, function (err, res, pkg) {
        t.notOk(res);
        t.equal(err && err.code, 'MODULE_NOT_FOUND');
        t.match(err && err.message, /Cannot find module 'invalid-config\/with-node_modules'/);
    });

    resolve('invalid-config/outside-package', { basedir: dir, ignoreExportsField: true }, function (err, res, pkg) {
        t.notOk(res);
        t.equal(err && err.code, 'MODULE_NOT_FOUND');
        t.match(err && err.message, /Cannot find module 'invalid-config\/outside-package'/);
    });

    resolve('invalid-config/not-with-dot', { basedir: dir, ignoreExportsField: true }, function (err, res, pkg) {
        t.notOk(res);
        t.equal(err && err.code, 'MODULE_NOT_FOUND');
        t.match(err && err.message, /Cannot find module 'invalid-config\/not-with-dot'/);
    });

    resolve('valid-config', { basedir: dir, ignoreExportsField: true }, function (err, res, pkg) {
        t.ifError(err);
        t.equal(res, path.join(dir, 'node_modules/valid-config/main.js'));
    });

    resolve('valid-config/package.json', { basedir: dir, ignoreExportsField: true }, function (err, res, pkg) {
        t.ifError(err);
        t.equal(res, path.join(dir, 'node_modules/valid-config/package.json'));
    });

    resolve('valid-config/remapped', { basedir: dir, ignoreExportsField: true }, function (err, res, pkg) {
        t.notOk(res);
        t.equal(err && err.code, 'MODULE_NOT_FOUND');
        t.match(err && err.message, /Cannot find module 'valid-config\/remapped'/);
    });

    resolve('valid-config/remapped/exists.js', { basedir: dir, ignoreExportsField: true }, function (err, res, pkg) {
        t.notOk(res);
        t.equal(err && err.code, 'MODULE_NOT_FOUND');
        t.match(err && err.message, /Cannot find module 'valid-config\/remapped\/exists.js'/);
    });

    resolve('valid-config/remapped/doesnt-exist.js', { basedir: dir, ignoreExportsField: true }, function (err, res, pkg) {
        t.notOk(res);
        t.equal(err && err.code, 'MODULE_NOT_FOUND');
        t.match(err && err.message, /Cannot find module 'valid-config\/remapped\/doesnt-exist\.js'/);
    });

    resolve('valid-config/array', { basedir: dir, ignoreExportsField: true }, function (err, res, pkg) {
        t.notOk(res);
        t.equal(err && err.code, 'MODULE_NOT_FOUND');
        t.match(err && err.message, /Cannot find module 'valid-config\/array'/);
    });

    resolve('valid-config/with-env', { basedir: dir, ignoreExportsField: true }, function (err, res, pkg) {
        t.notOk(res);
        t.equal(err && err.code, 'MODULE_NOT_FOUND');
        t.match(err && err.message, /Cannot find module 'valid-config\/with-env'/);
    });

    function iterateWithoutModifyingSubpath(request, start, getNodeModulesDirs, opts) {
        return [path.join(opts.basedir, 'other_modules', request)];
    }
    resolve('other-module-dir', { basedir: dir, ignoreExportsField: true, packageIterator: iterateWithoutModifyingSubpath }, function (err, res, pkg) {
        t.ifErr(err);
        t.equal(res, path.join(dir, 'other_modules/other-module-dir/index.js'));
    });

    function iterateModifyingSubpath(request, start, getNodeModulesDirs, opts) {
        return [path.join(opts.basedir, 'other_modules', request, 'index')];
    }
    resolve('other-module-dir', { basedir: dir, ignoreExportsField: true, packageIterator: iterateModifyingSubpath }, function (err, res, pkg) {
        t.ifErr(err);
        t.equal(res, path.join(dir, 'other_modules/other-module-dir/index.js'));
    });
});

test('exports sync (disabled)', function (t) {
    var dir = path.join(__dirname, '/exports');

    t.equal(resolve.sync('mix-conditionals', { basedir: dir, ignoreExportsField: true }), path.join(dir, 'node_modules/mix-conditionals/index.js'));

    try {
        resolve.sync('invalid-config/with-node_modules', { basedir: dir, ignoreExportsField: true });
        t.fail();
    } catch (err) {
        t.equal(err.code, 'MODULE_NOT_FOUND');
        t.match(err.message, /Cannot find module 'invalid-config\/with-node_modules'/);
    }

    try {
        resolve.sync('invalid-config/outside-package', { basedir: dir, ignoreExportsField: true });
        t.fail();
    } catch (err) {
        t.equal(err.code, 'MODULE_NOT_FOUND');
        t.match(err.message, /Cannot find module 'invalid-config\/outside-package'/);
    }

    try {
        resolve.sync('invalid-config/not-with-dot', { basedir: dir, ignoreExportsField: true });
        t.fail();
    } catch (err) {
        t.equal(err.code, 'MODULE_NOT_FOUND');
        t.match(err.message, /Cannot find module 'invalid-config\/not-with-dot'/);
    }

    t.equal(resolve.sync('valid-config', { basedir: dir, ignoreExportsField: true }), path.join(dir, 'node_modules/valid-config/main.js'));

    t.equal(resolve.sync('valid-config/package.json', { basedir: dir, ignoreExportsField: true }), path.join(dir, 'node_modules/valid-config/package.json'));

    try {
        resolve.sync('valid-config/remapped', { basedir: dir, ignoreExportsField: true });
        t.fail();
    } catch (err) {
        t.equal(err.code, 'MODULE_NOT_FOUND');
        t.match(err.message, /Cannot find module 'valid-config\/remapped'/);
    }

    try {
        resolve.sync('valid-config/remapped/exists.js', { basedir: dir, ignoreExportsField: true });
        t.fail();
    } catch (err) {
        t.equal(err.code, 'MODULE_NOT_FOUND');
        t.match(err.message, /Cannot find module 'valid-config\/remapped\/exists.js'/);
    }

    try {
        resolve.sync('valid-config/remapped/doesnt-exist.js', { basedir: dir, ignoreExportsField: true });
        t.fail();
    } catch (err) {
        t.equal(err.code, 'MODULE_NOT_FOUND');
        t.match(err.message, /Cannot find module 'valid-config\/remapped\/doesnt-exist\.js'/);
    }

    try {
        resolve.sync('valid-config/array', { basedir: dir, ignoreExportsField: true });
        t.fail();
    } catch (err) {
        t.equal(err.code, 'MODULE_NOT_FOUND');
        t.match(err.message, /Cannot find module 'valid-config\/array'/);
    }

    try {
        resolve.sync('valid-config/with-env', { basedir: dir, ignoreExportsField: true });
        t.fail();
    } catch (err) {
        t.equal(err.code, 'MODULE_NOT_FOUND');
        t.match(err.message, /Cannot find module 'valid-config\/with-env'/);
    }

    function iterateWithoutModifyingSubpath(request, start, getNodeModulesDirs, opts) {
        return [path.join(opts.basedir, 'other_modules', request)];
    }
    t.equal(resolve.sync('other-module-dir', { basedir: dir, ignoreExportsField: true, packageIterator: iterateWithoutModifyingSubpath }), path.join(dir, 'other_modules/other-module-dir/index.js'));

    function iterateModifyingSubpath(request, start, getNodeModulesDirs, opts) {
        return [path.join(opts.basedir, 'other_modules', request, 'index')];
    }
    t.equal(resolve.sync('other-module-dir', { basedir: dir, ignoreExportsField: true, packageIterator: iterateModifyingSubpath }), path.join(dir, 'other_modules/other-module-dir/index.js'));

    t.end();
});

