var path = require('path');

module.exports = function processResolution(opts) {
    if (process.versions.pnp) {
        var pnp = require('pnpapi');

        opts.preserveSymlinks = true;
        opts.useNodeModules = false;
        opts.paths = function (basedir, opts) {
            if (!opts || !opts.request) {
                throw new Error('Missing request option');
            }

            // Extract the name of the package being requested (1=full name, 2=scope name, 3=local name)
            var parts = opts.request.match(/^((?:(@[^/]+)\/)?([^/]+))/);

            // This is guaranteed to return the path to the "package.json" file from the given package
            var manifestPath = pnp.resolveToUnqualified(parts[1] + '/package.json', basedir);

            // The first dirname strips the package.json, the second strips the local named folder
            var nodeModules = path.dirname(path.dirname(manifestPath));

            // Strips the scope named folder if needed
            if (parts[2]) {
                nodeModules = path.dirname(nodeModules);
            }

            return [nodeModules];
        };
    }
};
