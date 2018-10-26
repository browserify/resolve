var test = require('tape');
var path = require('path');
var parse = path.parse || require('path-parse');
var keys = require('object-keys');

var nodeModulesPaths = require('../lib/node-modules-paths');

var verifyDirs = function verifyDirs(t, start, dirs, moduleDirectories, paths) {
    var moduleDirs = [].concat(moduleDirectories || 'node_modules');
    if (paths) {
        for (var k = 0; k < paths.length; ++k) {
            moduleDirs.push(path.basename(paths[k]));
        }
    }

    var foundModuleDirs = {};
    var uniqueDirs = {};
    var parsedDirs = {};
    for (var i = 0; i < dirs.length; ++i) {
        var parsed = parse(dirs[i]);
        if (!foundModuleDirs[parsed.base]) { foundModuleDirs[parsed.base] = 0; }
        foundModuleDirs[parsed.base] += 1;
        parsedDirs[parsed.dir] = true;
        uniqueDirs[dirs[i]] = true;
    }
    t.equal(keys(parsedDirs).length >= start.split(path.sep).length, true, 'there are >= dirs than "start" has');
    var foundModuleDirNames = keys(foundModuleDirs);
    t.deepEqual(foundModuleDirNames, moduleDirs, 'all desired module dirs were found');
    t.equal(keys(uniqueDirs).length, dirs.length, 'all dirs provided were unique');

    var counts = {};
    for (var j = 0; j < foundModuleDirNames.length; ++j) {
        counts[foundModuleDirs[j]] = true;
    }
    t.equal(keys(counts).length, 1, 'all found module directories had the same count');
};

test('node-modules-paths', function (t) {
    t.test('no options', function (t) {
        var start = path.join(__dirname, 'resolver');
        var dirs = nodeModulesPaths(start);

        verifyDirs(t, start, dirs);

        t.end();
    });

    t.test('empty options', function (t) {
        var start = path.join(__dirname, 'resolver');
        var dirs = nodeModulesPaths(start, {});

        verifyDirs(t, start, dirs);

        t.end();
    });

    t.test('with skipNodeModules=true option', function (t) {
        var start = path.join(__dirname, 'resolver');
        var dirs = nodeModulesPaths(start, { skipNodeModules: true });

        t.deepEqual(dirs, [], 'no node_modules was computed');

        t.end();
    });

    t.test('with paths=array option', function (t) {
        var start = path.join(__dirname, 'resolver');
        var paths = ['a', 'b'];
        var dirs = nodeModulesPaths(start, { paths: paths });

        verifyDirs(t, start, dirs, null, paths);

        t.end();
    });

    t.test('with paths=function option', function (t) {
        var paths = function paths(absoluteStart, opts) {
            return [path.join(absoluteStart, 'not node modules', opts.request)];
        };

        var start = path.join(__dirname, 'resolver');
        var dirs = nodeModulesPaths(start, { paths: paths, request: 'pkg' });

        verifyDirs(t, start, dirs, null, [path.join(start, 'not node modules', 'pkg')]);

        t.end();
    });

    t.test('with moduleDirectory option', function (t) {
        var start = path.join(__dirname, 'resolver');
        var moduleDirectory = 'not node modules';
        var dirs = nodeModulesPaths(start, { moduleDirectory: moduleDirectory });

        verifyDirs(t, start, dirs, moduleDirectory);

        t.end();
    });

    t.test('with 1 moduleDirectory and paths options', function (t) {
        var start = path.join(__dirname, 'resolver');
        var paths = ['a', 'b'];
        var moduleDirectory = 'not node modules';
        var dirs = nodeModulesPaths(start, { paths: paths, moduleDirectory: moduleDirectory });

        verifyDirs(t, start, dirs, moduleDirectory, paths);

        t.end();
    });

    t.test('with 1+ moduleDirectory and paths options', function (t) {
        var start = path.join(__dirname, 'resolver');
        var paths = ['a', 'b'];
        var moduleDirectories = ['not node modules', 'other modules'];
        var dirs = nodeModulesPaths(start, { paths: paths, moduleDirectory: moduleDirectories });

        verifyDirs(t, start, dirs, moduleDirectories, paths);

        t.end();
    });
});
