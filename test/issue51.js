var test = require('tap').test;
var resolve = require('../');
var path = require('path')

test('issue 51', function (t) {
    t.ok(resolve.sync('./issue51/test/') === path.resolve(__dirname, 'issue51/test/index.js'));
    resolve('./issue51/test/', function(e, result) {
        if(e) throw e
        t.ok(result === path.resolve(__dirname, 'issue51/test/index.js'));
        t.end();
    })
});
