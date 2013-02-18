var core = require('./lib/core');
exports.core = core;
exports.isCore = function (x) { return core[x] };
exports.sync = require('./lib/sync');
