var path = require('path');
var startsWith = require('string.prototype.startswith');

function validateExports(exports, basePath) {
    var isConditional = true;

    if (typeof exports === 'object' && !Array.isArray(exports)) {
        var exportKeys = Object.keys(exports);

        for (var i = 0; i < exportKeys.length; i++) {
            var isKeyConditional = exportKeys[i][0] !== '.';
            if (i === 0) {
                isConditional = isKeyConditional;
            } else if (isKeyConditional !== isConditional) {
                var err = new Error('Invalid package config ' + path.join(basePath, 'package.json') + ', '
                    + '"exports" cannot contain some keys starting with \'.\' and some not. '
                    + 'The exports object must either be an object of package subpath keys '
                    + 'or an object of main entry condition name keys only.');
                err.code = 'ERR_INVALID_PACKAGE_CONFIG';
                throw err;
            }
        }
    }

    if (isConditional) {
        return { '.': exports };
    } else {
        return exports;
    }
}

function validateConditions(names, packagePath) {
    // If exports contains any index property keys, as defined in ECMA-262 6.1.7 Array Index, throw an Invalid Package Configuration error.

    for (var i = 0; i < names.length; i++) {
        var name = names[i];
        var nameNum = Number(name);

        if (String(nameNum) === name && nameNum >= 0 && nameNum < 0xFFFFFFFF) {
            var err = new Error('Invalid package config ' + path.join(packagePath, 'package.json') + '. "exports" cannot contain numeric property keys');
            err.code = 'ERR_INVALID_PACKAGE_CONFIG';
            throw err;
        }
    }

    return names;
}

function resolvePackageTarget(packagePath, parent, key, target, subpath, internal, conditions) {
    if (typeof target === 'string') {
        var resolvedTarget = path.resolve(packagePath, target);
        var invalidTarget = false;

        if (!startsWith(target, './')) {
            if (!internal) {
                invalidTarget = true;
            } else if (!startsWith(target, '../') && !startsWith(target, '/')) {
                invalidTarget = true;
            } else {
                // TODO: imports need call package_resolve here
            }
        }

        var targetParts = target.split(/[\\/]/).slice(1); // slice to strip the leading '.'
        if (invalidTarget || targetParts.indexOf('node_modules') !== -1 || targetParts.indexOf('.') !== -1 || targetParts.indexOf('..') !== -1) {
            var err = new Error('Invalid "exports" target ' + JSON.stringify(target)
                + ' defined for ' + key + ' in ' + path.join(packagePath, 'package.json') + ' imported from ' + parent + '.');
            err.code = 'ERR_INVALID_PACKAGE_TARGET';
            throw err;
        }

        if (subpath !== '' && target[target.length - 1] !== '/') {
            err = new Error('Package subpath "' + subpath + '" is not a valid module request for '
                + 'the "exports" resolution of ' + path.join(packagePath, 'package.json') + ' imported from ' + parent + '.');
            err.code = 'ERR_INVALID_MODULE_SPECIFIER';
            throw err;
        }

        var resolved = path.normalize(resolvedTarget + subpath);
        var subpathParts = subpath.split(/[\\/]/);
        if (!startsWith(resolved, resolvedTarget) || subpathParts.indexOf('node_modules') !== -1 || subpathParts.indexOf('.') !== -1 || subpathParts.indexOf('..') !== -1) {
            err = new Error('Package subpath "' + subpath + '" is not a valid module request for '
                + 'the "exports" resolution of ' + path.join(packagePath, 'package.json') + ' imported from ' + parent + '.');
            err.code = 'ERR_INVALID_MODULE_SPECIFIER';
            throw err;
        }

        return resolved;
    }

    if (Array.isArray(target)) {
        if (target.length === 0) {
            err = new Error(key === '.'
                ? 'No "exports" main resolved in ' + path.join(packagePath, 'package.json') + '.'
                : 'Package subpath ' + key + ' is not defined by "exports" in ' + path.join(packagePath, 'package.json') + ' imported from ' + parent + '.');
            err.code = 'ERR_PACKAGE_PATH_NOT_EXPORTED';
            throw err;
        }

        var lastError;
        for (var i = 0; i < target.length; i++) {
            try {
                return resolvePackageTarget(packagePath, parent, key, target[i], subpath, internal, conditions);
            } catch (e) {
                if (e && (e.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED' || e.code === 'ERR_INVALID_PACKAGE_TARGET')) {
                    lastError = e;
                } else {
                    throw e;
                }
            }
        }
        throw lastError;
    }

    if (target === null) {
        err = new Error(key === '.'
            ? 'No "exports" main resolved in ' + path.join(packagePath, 'package.json') + '.'
            : 'Package subpath ' + key + ' is not defined by "exports" in ' + path.join(packagePath, 'package.json') + ' imported from ' + parent + '.');
        err.code = 'ERR_PACKAGE_PATH_NOT_EXPORTED';
        throw err;
    }

    if (typeof target !== 'object') {
        err = new Error('Invalid "exports" target ' + JSON.stringify(target)
            + ' defined for ' + key + ' in ' + path.join(packagePath, 'package.json') + ' imported from ' + parent + '.');
        err.code = 'ERR_INVALID_PACKAGE_TARGET';
        throw err;
    }

    var exportedConditions = validateConditions(Object.keys(target), packagePath);

    for (i = 0; i < exportedConditions.length; i++) {
        var exportedCondition = exportedConditions[i];
        if (exportedCondition === 'default' || conditions.indexOf(exportedCondition) !== -1) {
            try {
                return resolvePackageTarget(
                    packagePath,
                    parent,
                    key,
                    target[exportedCondition],
                    subpath,
                    internal,
                    conditions
                );
            } catch (e) {
                if (!e || e.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
                    throw e;
                }
            }
        }
    }

    err = new Error(key === '.'
        ? 'No "exports" main resolved in ' + path.join(packagePath, 'package.json') + '.'
        : 'Package subpath ' + key + ' is not defined by "exports" in ' + path.join(packagePath, 'package.json') + ' imported from ' + parent + '.');
    err.code = 'ERR_PACKAGE_PATH_NOT_EXPORTED';
    throw err;
}

function resolveImportExport(packagePath, parent, matchObj, matchKey, isImports, conditions) {
    if (Object.prototype.hasOwnProperty.call(matchObj, matchKey) && matchKey[matchKey.length - 1] !== '*') {
        return {
            resolved: resolvePackageTarget(packagePath, parent, matchKey, matchObj[matchKey], '', isImports, conditions),
            exact: true
        };
    }

    var longestMatchingExport = '';
    var exportedPaths = Object.keys(matchObj);

    for (var i = 0; i < exportedPaths.length; i++) {
        var exportedPath = exportedPaths[i];
        if (exportedPath[exportedPath.length - 1] === '/' && startsWith(matchKey, exportedPath) && exportedPath.length > longestMatchingExport.length) {
            longestMatchingExport = exportedPath;
        }
    }

    if (longestMatchingExport === '') {
        var err = new Error('Package subpath ' + matchKey + ' is not defined by "exports" in '
            + path.join(packagePath, 'package.json') + ' imported from ' + parent + '.');
        err.code = 'ERR_PACKAGE_PATH_NOT_EXPORTED';
        throw err;
    }

    return {
        resolved: resolvePackageTarget(
            packagePath,
            parent,
            longestMatchingExport,
            matchObj[longestMatchingExport],
            matchKey.slice(longestMatchingExport.length - 1),
            isImports,
            conditions
        ),
        exact: false
    };
}

module.exports = function resolveExports(packagePath, parent, subpath, exports, conditions) {
    return resolveImportExport(
        packagePath,
        parent,
        validateExports(exports, packagePath),
        '.' + subpath,
        false,
        conditions
    );
};
