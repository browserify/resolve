var path = require('path');
var test = require('tap').test;
var resolve = require('../');

// Ensure that the `opts.paths` paths are searched
test('opts.paths', function (t) {
    t.plan(4);

    resolve('aaa', {
        paths: [
            __dirname + '/node_path/x',
            __dirname + '/node_path/y'
        ],
        basedir: __dirname,
    }, function (err, res) {
        t.equal(res, __dirname + '/node_path/x/aaa/index.js');
    });

    resolve('bbb', {
        paths: [
            __dirname + '/node_path/x',
            __dirname + '/node_path/y'
        ],
        basedir: __dirname,
    }, function (err, res) {
        t.equal(res, __dirname + '/node_path/y/bbb/index.js');
    });

    resolve('ccc', {
        paths: [
            __dirname + '/node_path/x',
            __dirname + '/node_path/y'
        ],
        basedir: __dirname,
    }, function (err, res) {
        t.equal(res, __dirname + '/node_path/x/ccc/index.js');
    });

    // ensure that relative paths still resolve against the
    // regular `node_modules` correctly
    resolve('tap', {
        paths: [
            'node_path',
        ],
        basedir: 'node_path/x',
    }, function (err, res) {
        t.equal(res, path.resolve(__dirname, '..', 'node_modules/tap/lib/main.js'));
    });
});

// Ensure that the `NODE_PATH` environment is searched
test('$NODE_PATH async', function (t) {
    t.plan(4);

    // Construct the NODE_PATH environment variable
    var nodePaths = [
        __dirname + '/node_path/x',
        __dirname + '/node_path/y'
    ];

    var delimeter = process.platform === 'win32' ? ';' : ':';
    process.env.NODE_PATH = nodePaths.join(delimeter);

    resolve('aaa', {
    }, function (err, res) {
        t.equal(res, __dirname + '/node_path/x/aaa/index.js');
    });

    resolve('bbb', {
    }, function (err, res) {
        t.equal(res, __dirname + '/node_path/y/bbb/index.js');
    });

    resolve('ccc', {
    }, function (err, res) {
        t.equal(res, __dirname + '/node_path/x/ccc/index.js');
    });

    // ensure that relative paths still resolve against the
    // regular `node_modules` correctly
    resolve('tap', {
        paths: [
            'node_path',
        ],
        basedir: 'node_path/x',
    }, function (err, res) {
        t.equal(res, path.resolve(__dirname, '..', 'node_modules/tap/lib/main.js'));
    });
});

// Ensure that the `NODE_PATH` environment is searched in sync
test('$NODE_PATH sync', function (t) {
    t.plan(4);

    // Construct the NODE_PATH environment variable
    var nodePaths = [
        __dirname + '/node_path/x',
        __dirname + '/node_path/y'
    ];

    var delimeter = process.platform === 'win32' ? ';' : ':';
    process.env.NODE_PATH = nodePaths.join(delimeter);

    var res = resolve.sync('aaa');
    t.equal(res, __dirname + '/node_path/x/aaa/index.js');

    res = resolve.sync('bbb');
    t.equal(res, __dirname + '/node_path/y/bbb/index.js');

    res = resolve.sync('ccc');
    t.equal(res, __dirname + '/node_path/x/ccc/index.js');

    // ensure that relative paths still resolve against the
    // regular `node_modules` correctly
    res = resolve.sync('tap');
    t.equal(res, path.resolve(__dirname, '..', 'node_modules/tap/lib/main.js'));
});
