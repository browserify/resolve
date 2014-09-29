var test = require('tape');
var path = require('path');
var defined = require('defined');
var Levenshtein = require('levenshtein');

test.Test.prototype.equalPaths = function (a, b, msg, extra) {
    var result = (
        typeof a === 'string' && 
        typeof b === 'string' && 
        path.relative(a, b) === '');
    this._assert(result, {
        message : defined(msg, 'should be equal'),
        operator : 'equal',
        actual : a,
        expected : b,
        extra : extra
    });
};

test.Test.prototype.equalAlmost = function (a, b, msg, extra) {
    extra = extra || {};
    extra.similarity = extra.similarity || 0.05; // 5%
    var result = (
        typeof a === 'string' && 
        typeof b === 'string' && 
        (new Levenshtein(a, b)).distance / (a.length + b.length) < extra.similarity);
    this._assert(result, {
        message : defined(msg, 'should be equal'),
        operator : 'equal',
        actual : a,
        expected : b,
        extra : extra
    });
};

module.exports = test;