var assert = require('assert');
var resolve = require('../');

exports.core = function () {
    assert.ok(resolve.isCore('fs'));
    assert.ok(resolve.isCore('net'));
    assert.ok(resolve.isCore('http'));
    
    assert.ok(!resolve.isCore('seq'));
    assert.ok(!resolve.isCore('../'));
};
