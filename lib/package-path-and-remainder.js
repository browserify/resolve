var path = require('path');

module.exports = function packagePathAndRemainder(x) {
	var nmStr = "node_modules";
    var splitRe = process.platform === 'win32' ? /[\/\\]/ : /\/+/;
    var lastNodeModules = x.lastIndexOf(nmStr);
    if(lastNodeModules !== -1) {
		var afterNodeModules = x.substr(lastNodeModules+nmStr.length+1);
		var parts = afterNodeModules.split(splitRe),
			packageName = parts.shift();
		return {
			path: path.join(x.substr(0, lastNodeModules+nmStr.length),packageName),
			remainder: parts.length ? path.join.apply(path, parts) : null
		};
    } else {
		return null;
    }
};
