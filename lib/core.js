module.exports = require('repl')._builtinLibs.reduce(function (acc, x) {
    acc[x] = true;
    return acc;
}, {});
