var test = require('../lib/test-utils');

var nmp = require('../lib/node-modules-paths.js');

if (process.platform !== 'win32') return;

test('node_modules_paths windows', function (t) {
    
    var paths = nmp('C:\\things', {});
    console.log(paths);
    t.equalPaths("C:\\things\\node_modules", paths[0]);
    t.end();
});
