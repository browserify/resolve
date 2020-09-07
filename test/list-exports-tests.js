var fs = require('fs');
var path = require('path');
var test = require('tape');
var resolve = require('../');

var fixturesPath = path.join(__dirname, 'list-exports/packages/tests/fixtures');

fs.readdirSync(fixturesPath).forEach(function (fixtureName) {
    var fixtureSpec = require(path.join(fixturesPath, fixtureName, 'expected.json'));
    var fixturePackagePath = path.join(fixturesPath, fixtureName, 'project');

    function packageIterator(identifier) {
        var slashIdx = identifier.indexOf('/');

        if (slashIdx === -1) {
            return identifier === fixtureSpec.name ? [fixturePackagePath] : null;
        }

        if (identifier.slice(0, slashIdx) === fixtureSpec.name) {
            return [fixturePackagePath + identifier.slice(slashIdx)];
        } else {
            return null;
        }
    }

    var optsWithExports = { packageIterator: packageIterator, ignoreExportsField: false, extensions: ['.js', '.json'] };
    var optsWithoutExports = { packageIterator: packageIterator, ignoreExportsField: true, extensions: ['.js', '.json'] };

    if (fixtureName === 'ls-exports' || fixtureName === 'list-exports') {
        optsWithExports.preserveSymlinks = true;
        optsWithoutExports.preserveSymlinks = true;
    }

    test('list-exports-tests fixture ' + fixtureName, function (t) {
        /*
         * Sanity check: package.json should be resolvable with exports disabled
         * All other tests are configured via the expected.json file
         */
        resolve(fixtureSpec.name + '/package.json', optsWithoutExports, function (err, res, pkg) {
            t.ifErr(err);
            t.equal(path.normalize(res), path.join(fixturePackagePath, 'package.json'), 'sanity check');
        });

        // with exports enabled

        if (fixtureSpec.private) {
            t.plan(2);
            return;
        }

        t.plan(2 * (1 + fixtureSpec.require.length + fixtureSpec['require (pre-exports)'].length));

        fixtureSpec.require.forEach(function (identifier) {
            resolve(identifier, optsWithExports, function (err, res, pkg) {
                t.ifErr(err);
                var tree = fixtureSpec.tree[fixtureSpec.name];

                var relativeResolvedParts = path.relative(fixturePackagePath, res).split(path.sep);

                for (var i = 0; i < relativeResolvedParts.length; i++) {
                    tree = tree[relativeResolvedParts[i]];

                    if (!tree) {
                        t.fail('Unexpected resolved path ' + JSON.stringify(res) + ' for ' + JSON.stringify(identifier));
                    }
                }

                t.notEqual(tree.indexOf(identifier), -1, 'resolved path ' + JSON.stringify(res) + ' for ' + JSON.stringify(identifier));
            });
        });

        fixtureSpec['require (pre-exports)'].forEach(function (identifier) {
            resolve(identifier, optsWithoutExports, function (err, res, pkg) {
                t.ifErr(err);
                var tree = fixtureSpec['tree (pre-exports)'][fixtureSpec.name];

                var relativeResolvedParts = path.relative(fixturePackagePath, res).split(path.sep);

                for (var i = 0; i < relativeResolvedParts.length; i++) {
                    tree = tree[relativeResolvedParts[i]];

                    if (!tree) {
                        t.fail('Unexpected resolved path ' + JSON.stringify(res) + ' for ' + JSON.stringify(identifier));
                    }
                }

                t.notEqual(tree.indexOf(identifier), -1, 'resolved path ' + JSON.stringify(res) + ' for ' + JSON.stringify(identifier));
            });
        });
    });

    test('list-exports-tests fixture ' + fixtureName + ' sync', function (t) {
        /*
         * Sanity check: package.json should be resolvable with exports disabled
         * All other tests are configured via the expected.json file
         */
        t.equal(path.normalize(resolve.sync(fixtureSpec.name + '/package.json', optsWithoutExports)), path.join(fixturePackagePath, 'package.json'), 'sanity check');

        // with exports enabled

        if (fixtureSpec.private) {
            t.end();
            return;
        }

        fixtureSpec.require.forEach(function (identifier) {
            var resolved = resolve.sync(identifier, optsWithExports);
            var tree = fixtureSpec.tree[fixtureSpec.name];

            var relativeResolvedParts = path.relative(fixturePackagePath, resolved).split(path.sep);

            for (var i = 0; i < relativeResolvedParts.length; i++) {
                tree = tree[relativeResolvedParts[i]];

                if (!tree) {
                    t.fail('Unexpected resolved path ' + JSON.stringify(resolved) + ' for ' + JSON.stringify(identifier));
                }
            }

            t.notEqual(tree.indexOf(identifier), -1, 'resolved path ' + JSON.stringify(resolved) + ' for ' + JSON.stringify(identifier));
        });

        fixtureSpec['require (pre-exports)'].forEach(function (identifier) {
            var resolved = resolve.sync(identifier, optsWithoutExports);
            var tree = fixtureSpec['tree (pre-exports)'][fixtureSpec.name];

            var relativeResolvedParts = path.relative(fixturePackagePath, resolved).split(path.sep);

            for (var i = 0; i < relativeResolvedParts.length; i++) {
                tree = tree[relativeResolvedParts[i]];

                if (!tree) {
                    t.fail('Unexpected resolved path ' + JSON.stringify(resolved) + ' for ' + JSON.stringify(identifier));
                }
            }

            t.notEqual(tree.indexOf(identifier), -1, 'resolved path ' + JSON.stringify(resolved) + ' for ' + JSON.stringify(identifier));
        });

        t.end();
    });
});
