resolve
=======

Implements the [node `require.resolve()`
algorithm](http://nodejs.org/docs/v0.4.8/api/all.html#all_Together...)
except you can pass in the file to compute paths relatively to along with your
own `require.paths` without updating the global copy (which doesn't even work in
node `>=0.5`).

example
=======

methods
=======

resolve(pkg, opts={paths:[],path:__filename})
---------------------------------------------

Search for the package/filename `pkg`
according to the [`require.resolve()`
algorithm](http://nodejs.org/docs/v0.4.8/api/all.html#all_Together...)
for `X=pkg` and `Y=opts.path`.

If nothing is found, all of the directories in `opts.path` are searched.
