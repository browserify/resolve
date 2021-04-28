var resolveAsync = require('./async');

function resolve(x, options, callback) {
    // backward compatibility for using callbacks
    if (typeof options === 'function' || typeof callback === 'function') {
        return resolveAsync(x, options, callback);
    }
    // return a promise in other cases
    /* global Promise */
    return new Promise(function (promiseResolve) {
        resolveAsync(x, options, function (err, res) {
            if (err) {
                throw err;
            }
            return promiseResolve(res);
        });
    });
}

module.exports = resolve;
