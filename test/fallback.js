var test = require('tape');
var resolve = require('../');

test('fallback sync', function (t) {
    var fallback = '<NOT_FOUND>';
    var filename = 'nonExistentFile_' + Math.random().toString();

    var invalidValues = [
        undefined,
        null,
        false,
        true,
        42,
        Symbol('fallback sync'),
        [],
        function () {},
        {}
    ];

    t.plan(2 + invalidValues.length);

    var a = resolve.sync(filename, { fallback: fallback });
    t.equal(a, fallback);

    var b = resolve.sync(filename, { fallback: '' });
    t.equal(b, '');

    invalidValues.forEach(function (invalidValue) {
        function run() {
            resolve.sync(filename, { fallback: invalidValue });
        }
        t.throws(run, 'should have thrown an error for invalid value ' + String(invalidValue));
    });
});
