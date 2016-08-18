var test = require('../lib/test-utils');
var resolve = require('../');

test('#62: deep module references and the pathFilter', function(t){
	t.plan(9);
    
	var resolverDir = __dirname + '/pathfilter/deep_ref';
	var pathFilter = function(pkg, x, remainder){
		t.equal(pkg.version, "1.2.3");
		t.equalPaths(x, resolverDir + '/node_modules/deep/ref');
		t.equal(remainder, "ref");
		return "alt";
	};
	
	resolve('deep/ref', { basedir : resolverDir }, function (err, res, pkg) {
        if (err) t.fail(err);

        t.equal(pkg.version, "1.2.3");
        t.equalPaths(res, resolverDir + '/node_modules/deep/ref.js');
    });

    resolve('deep/deeper/ref', { basedir: resolverDir },
    function(err, res, pkg) {
      if(err) t.fail(err);
      t.notEqual(pkg, undefined);
      t.equal(pkg.version, "1.2.3");
      t.equalPaths(res, resolverDir + '/node_modules/deep/deeper/ref.js');
    });
    
    resolve('deep/ref', { basedir : resolverDir, pathFilter : pathFilter },
    function (err, res, pkg) {
        if (err) t.fail(err);
        t.equalPaths(res, resolverDir + '/node_modules/deep/alt.js');
    });
});
