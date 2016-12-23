var test = require('tape');
var path = require('path');

var getAllNodeModulePathsUpwards = function (start, moduleDirectory) {
    if (!moduleDirectory) { moduleDirectory = 'node_modules'; }
    var currentPath = start;
    var expectedDirs = ['/' + path.join(currentPath, moduleDirectory)];
    while (currentPath && currentPath !== '/') {
        currentPath = path.join(currentPath, '../');
        expectedDirs.push('/' + path.join(currentPath, moduleDirectory));
    }
    return expectedDirs;
};

var nodeModulesPaths = require('../lib/node-modules-paths');

test('node-modules-paths', function (t) {
    t.test('no options', function (t) {
        var start = path.join(__dirname, 'resolver');
        var dirs = nodeModulesPaths(start);

        var expectedDirs = getAllNodeModulePathsUpwards(start);

        t.deepEqual(dirs, expectedDirs);

        t.end();
    });

    t.test('empty options', function (t) {
        var start = path.join(__dirname, 'resolver');
        var dirs = nodeModulesPaths(start, {});

        var expectedDirs = getAllNodeModulePathsUpwards(start);

        t.deepEqual(dirs, expectedDirs);

        t.end();
    });

    t.test('with paths option', function (t) {
        var start = path.join(__dirname, 'resolver');
        var paths = ['a', 'b'];
        var dirs = nodeModulesPaths(start, { paths: paths });

        var expectedDirs = getAllNodeModulePathsUpwards(start);

        t.deepEqual(dirs, expectedDirs.concat(paths));

        t.end();
    });

    t.test('with moduleDirectory option', function (t) {
        var start = path.join(__dirname, 'resolver');
        var paths = ['a', 'b'];
        var dirs = nodeModulesPaths(start, { paths: paths });

        var expectedDirs = getAllNodeModulePathsUpwards(start);

        t.deepEqual(dirs, expectedDirs.concat(paths));

        t.end();
    });

    t.test('with moduleDirectory and paths options', function (t) {
        var start = path.join(__dirname, 'resolver');
        var paths = ['a', 'b'];
        var moduleDirectory = 'not node modules';
        var dirs = nodeModulesPaths(start, { paths: paths, moduleDirectory: moduleDirectory });

        var expectedDirs = getAllNodeModulePathsUpwards(start, moduleDirectory);

        t.deepEqual(dirs, expectedDirs.concat(paths));

        t.end();
    });
});
