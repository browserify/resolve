// Just walks the exports object synchronously looking for a match.
// Does not validate that the module it finds actually exists.

// Returns undefined if no match was found, null if a match was explicitly
// forbidden by setting the value to null in the exports object. Either
// null or undefined at the caller value have the same effective meaning,
// no match is available.
var resolveExports = function resolveExports (exp, conditions, sub) {
    if (!exp) return exp;
    if (typeof exp === 'string' && (sub === '.' || sub === null)) return exp;
    // TODO: check if this should throw?
    if (typeof exp !== 'object') return null;
    if (Array.isArray(exp) && (sub === '.' || sub === null)) {
        for (var i = 0; i < exp.length; i++) {
            var resolved = resolveExports(exp[i], conditions);
            if (resolved || resolved === null) return resolved;
        }
    }
    if (sub !== null) {
        if (Object.prototype.hasOwnProperty.call(exp, sub)) {
            return resolveExports(exp[sub], conditions, null);
        } else if (sub !== '.') {
            // sub=./x, exports={require:'./y'}, not a match
            return undefined;
        }
    }
    var keys = Object.keys(exp);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key === 'default') return resolveExports(exp[key], conditions, null);
        var k = conditions.indexOf(key);
        if (k !== -1) {
            const resolved = resolveExports(exp[key], conditions, null);
            if (resolved || resolved === null) return resolved;
        }
    }
    return undefined;
}

module.exports = resolveExports;
