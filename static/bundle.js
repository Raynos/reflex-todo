(function(){var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee",".json",".html",".svg"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';

        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';

        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }

        var n = loadNodeModulesSync(x, y);
        if (n) return n;

        throw new Error("Cannot find module '" + x + "'");

        function loadAsFileSync (x) {
            x = path.normalize(x);
            if (require.modules[x]) {
                return x;
            }

            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }

        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = path.normalize(x + '/package.json');
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }

            return loadAsFileSync(x + '/index');
        }

        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }

            var m = loadAsFileSync(x);
            if (m) return m;
        }

        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');

            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }

            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);

    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    })(require.modules);

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

(function () {
    var process = {};
    var global = typeof window !== 'undefined' ? window : {};
    var definedProcess = false;

    require.define = function (filename, fn) {
        if (!definedProcess && require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
            definedProcess = true;
        }

        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;

        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };

        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process,
                global
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",Function(['require','module','exports','__dirname','__filename','process','global'],"function filter (xs, fn) {\n    var res = [];\n    for (var i = 0; i < xs.length; i++) {\n        if (fn(xs[i], i, xs)) res.push(xs[i]);\n    }\n    return res;\n}\n\n// resolves . and .. elements in a path array with directory names there\n// must be no slashes, empty elements, or device names (c:\\) in the array\n// (so also no leading and trailing slashes - it does not distinguish\n// relative and absolute paths)\nfunction normalizeArray(parts, allowAboveRoot) {\n  // if the path tries to go above the root, `up` ends up > 0\n  var up = 0;\n  for (var i = parts.length; i >= 0; i--) {\n    var last = parts[i];\n    if (last == '.') {\n      parts.splice(i, 1);\n    } else if (last === '..') {\n      parts.splice(i, 1);\n      up++;\n    } else if (up) {\n      parts.splice(i, 1);\n      up--;\n    }\n  }\n\n  // if the path is allowed to go above the root, restore leading ..s\n  if (allowAboveRoot) {\n    for (; up--; up) {\n      parts.unshift('..');\n    }\n  }\n\n  return parts;\n}\n\n// Regex to split a filename into [*, dir, basename, ext]\n// posix version\nvar splitPathRe = /^(.+\\/(?!$)|\\/)?((?:.+?)?(\\.[^.]*)?)$/;\n\n// path.resolve([from ...], to)\n// posix version\nexports.resolve = function() {\nvar resolvedPath = '',\n    resolvedAbsolute = false;\n\nfor (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {\n  var path = (i >= 0)\n      ? arguments[i]\n      : process.cwd();\n\n  // Skip empty and invalid entries\n  if (typeof path !== 'string' || !path) {\n    continue;\n  }\n\n  resolvedPath = path + '/' + resolvedPath;\n  resolvedAbsolute = path.charAt(0) === '/';\n}\n\n// At this point the path should be resolved to a full absolute path, but\n// handle relative paths to be safe (might happen when process.cwd() fails)\n\n// Normalize the path\nresolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {\n    return !!p;\n  }), !resolvedAbsolute).join('/');\n\n  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';\n};\n\n// path.normalize(path)\n// posix version\nexports.normalize = function(path) {\nvar isAbsolute = path.charAt(0) === '/',\n    trailingSlash = path.slice(-1) === '/';\n\n// Normalize the path\npath = normalizeArray(filter(path.split('/'), function(p) {\n    return !!p;\n  }), !isAbsolute).join('/');\n\n  if (!path && !isAbsolute) {\n    path = '.';\n  }\n  if (path && trailingSlash) {\n    path += '/';\n  }\n  \n  return (isAbsolute ? '/' : '') + path;\n};\n\n\n// posix version\nexports.join = function() {\n  var paths = Array.prototype.slice.call(arguments, 0);\n  return exports.normalize(filter(paths, function(p, index) {\n    return p && typeof p === 'string';\n  }).join('/'));\n};\n\n\nexports.dirname = function(path) {\n  var dir = splitPathRe.exec(path)[1] || '';\n  var isWindows = false;\n  if (!dir) {\n    // No dirname\n    return '.';\n  } else if (dir.length === 1 ||\n      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {\n    // It is just a slash or a drive letter with a slash\n    return dir;\n  } else {\n    // It is a full dirname, strip trailing slash\n    return dir.substring(0, dir.length - 1);\n  }\n};\n\n\nexports.basename = function(path, ext) {\n  var f = splitPathRe.exec(path)[2] || '';\n  // TODO: make this comparison case-insensitive on windows?\n  if (ext && f.substr(-1 * ext.length) === ext) {\n    f = f.substr(0, f.length - ext.length);\n  }\n  return f;\n};\n\n\nexports.extname = function(path) {\n  return splitPathRe.exec(path)[3] || '';\n};\n\n//@ sourceURL=path"
));

require.define("__browserify_process",Function(['require','module','exports','__dirname','__filename','process','global'],"var process = module.exports = {};\n\nprocess.nextTick = (function () {\n    var canSetImmediate = typeof window !== 'undefined'\n        && window.setImmediate;\n    var canPost = typeof window !== 'undefined'\n        && window.postMessage && window.addEventListener\n    ;\n\n    if (canSetImmediate) {\n        return window.setImmediate;\n    }\n\n    if (canPost) {\n        var queue = [];\n        window.addEventListener('message', function (ev) {\n            if (ev.source === window && ev.data === 'browserify-tick') {\n                ev.stopPropagation();\n                if (queue.length > 0) {\n                    var fn = queue.shift();\n                    fn();\n                }\n            }\n        }, true);\n\n        return function nextTick(fn) {\n            queue.push(fn);\n            window.postMessage('browserify-tick', '*');\n        };\n    }\n\n    return function nextTick(fn) {\n        setTimeout(fn, 0);\n    };\n})();\n\nprocess.title = 'browser';\nprocess.browser = true;\nprocess.env = {};\nprocess.argv = [];\n\nprocess.binding = function (name) {\n    if (name === 'evals') return (require)('vm')\n    else throw new Error('No such module. (Possibly not yet loaded)')\n};\n\n(function () {\n    var cwd = '/';\n    var path;\n    process.cwd = function () { return cwd };\n    process.chdir = function (dir) {\n        if (!path) path = require('path');\n        cwd = path.resolve(dir, cwd);\n    };\n})();\n\n//@ sourceURL=__browserify_process"
));

require.define("/node_modules/insert/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"index\"}\n//@ sourceURL=/node_modules/insert/package.json"
));

require.define("/node_modules/insert/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var slice = Array.prototype.slice\n    , toArray = slice.call.bind(slice)\n\nmodule.exports = {\n    prepend: prepend\n    , append: append\n    , after: after\n    , before: before\n    , remove: remove\n    , replace: replace\n    , mutation: mutation\n}\n\nfunction prepend(parent) {\n    var node = mutation(toArray(arguments, 1))\n    parent.insertBefore(node, parent.firstChild)\n}\n\nfunction append(parent) {\n    var node = mutation(toArray(arguments, 1))\n    parent.appendChild(node)\n}\n\nfunction before(sibling) {\n    var node = mutation(toArray(arguments, 1))\n        , parent = sibling.parentNode\n\n    parent.insertBefore(node, sibling)\n}\n\nfunction after(sibling) {\n    var node = mutation(toArray(arguments, 1))\n        , parent = sibling.parentNode\n        , child = sibling.nextSibling\n\n    parent.insertBefore(node, child)\n}\n\nfunction replace(target) {\n    var node = mutation(toArray(arguments, 1))\n        , parent = target.parentNode\n\n    parent.replaceChild(node, target)\n}\n\nfunction remove() {\n    var list = toArray(arguments)\n    list.forEach(removeFromParent)\n}\n\nfunction removeFromParent(elem) {\n    elem.parentNode.removeChild(elem)\n}\n\nfunction mutation(list) {\n    list = list.map(replaceStringWithTextNode)\n\n    if (list.length === 1) {\n        return list[0]\n    }\n\n    var frag = document.createDocumentFragment()\n    list.forEach(appendToFragment, frag)\n    return frag\n}\n\nfunction replaceStringWithTextNode(string) {\n    if (typeof string === \"string\") {\n        return document.createTextNode(string)\n    }\n\n    return string\n}\n\nfunction appendToFragment(elem) {\n    this.appendChild(elem)\n}\n//@ sourceURL=/node_modules/insert/index.js"
));

require.define("/node_modules/ap/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"./index.js\"}\n//@ sourceURL=/node_modules/ap/package.json"
));

require.define("/node_modules/ap/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"exports = module.exports = ap;\nfunction ap (args, fn) {\n    return function () {\n        return fn.apply(this, args.concat.apply(args, arguments));\n    };\n}\n\nexports.pa = pa;\nfunction pa (args, fn) {\n    return function () {\n        return fn.apply(this, [].slice.call(arguments).concat(args));\n    };\n}\n\nexports.apa = apa;\nfunction apa (left, right, fn) {\n    return function () {\n        return fn.apply(this,\n            left.concat.apply(left, arguments).concat(right)\n        );\n    };\n}\n\nexports.partial = partial;\nfunction partial (fn) {\n    var args = [].slice.call(arguments, 1);\n    return ap(args, fn);\n}\n\nexports.partialRight = partialRight;\nfunction partialRight (fn) {\n    var args = [].slice.call(arguments, 1);\n    return pa(args, fn);\n}\n\nexports.curry = curry;\nfunction curry (fn) {\n    return partial(partial, fn);\n}\n\nexports.curryRight = function curryRight (fn) {\n    return partial(partialRight, fn);\n}\n\n//@ sourceURL=/node_modules/ap/index.js"
));

require.define("/node_modules/reducers/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {}\n//@ sourceURL=/node_modules/reducers/package.json"
));

require.define("/node_modules/reducers/channel.js",Function(['require','module','exports','__dirname','__filename','process','global'],"\"use strict\";\n\nvar hub = require(\"./hub\")\nvar signal = require(\"./signal\")\n\nfunction channel() {\n  /**\n  Return a channel -- a sequence of events over time that may be reduced by\n  one or more consumer functions.\n\n  Channels are `signals` that have been transformed by `hub`, allowing them\n  to be reduced more than once.\n  **/\n  return hub(signal())\n}\n\nmodule.exports = channel\n\n//@ sourceURL=/node_modules/reducers/channel.js"
));

require.define("/node_modules/reducers/hub.js",Function(['require','module','exports','__dirname','__filename','process','global'],"\"use strict\";\n\nvar accumulate = require(\"./accumulate\")\nvar convert = require(\"./convert\")\nvar accumulated = require(\"./accumulated\")\nvar end = require(\"./end\")\n\nvar input = \"input@\" + module.id\nvar consumers = \"consumers@\" + module.id\n\nfunction close(consumers, end) {\n  while (consumers.length) {\n    var count = consumers.length\n    var index = 0\n    while (index < count) {\n      var consumer = consumers[index]\n      consumer.next(end, consumer.state)\n      index = index + 1\n    }\n    consumers.splice(0, count)\n  }\n}\n\nfunction dispatch(consumers, value) {\n  var count = consumers.length\n  var index = 0\n  while (index < count) {\n    var consumer = consumers[index]\n    var state = consumer.next(value, consumer.state)\n    // If consumer has finished accumulation remove it from the consumers\n    // list. And dispatch end of stream on it (maybe that should not be\n    // necessary).\n    if (state && state.is === accumulated) {\n      consumers.splice(index, 1)\n      consumer.next(end(), state.value)\n      // If consumer is removed than we decrease count as consumers array\n      // will contain less elements (unless of course more elements were\n      // added but we would like to ignore those).\n      count = count - 1\n    } else {\n      consumer.state = state\n      index = index + 1\n    }\n  }\n}\n\nfunction open(hub) {\n  var source = hub[input]\n  var reducers = hub[consumers]\n  hub[input] = null         // mark hub as open\n  accumulate(source, function distribute(value) {\n    // If it's end of the source we close all the reducers including\n    // ones that subscribe as side effect.\n    if (value && value.is === end) close(reducers, value)\n    // otherwise we dispatch value to all the registered reducers.\n    else dispatch(reducers, value)\n\n    // reducers will be empty if either source is drained or if all the\n    // reducers finished reductions. Either way we reset input back to\n    // source and return `accumulated` marker to stop the reduction of\n    // source.\n    if (reducers.length === 0) {\n      hub[input] = source\n      return accumulated()\n    }\n  })\n}\n\nfunction isHub(value) {\n  return !value || (input in value && consumers in value)\n}\n\nfunction isOpen(hub) {\n  return hub[input] === null\n}\n\nfunction hub(source) {\n  /**\n  Take a reducible `source`, such as a `signal` and return a reducible that can\n  be consumed by many reducers.\n  **/\n\n  // If source is already a hub avoid just return.\n  if (isHub(source)) return source\n  var value = convert(source, hub.accumulate)\n  value[input] = source\n  value[consumers] = []\n  return value\n}\nhub.isHub = isHub\nhub.isOpen = isOpen\nhub.accumulate = function accumulate(hub, next, initial) {\n  // Enqueue new consumer into consumers array so that new\n  // values will be delegated to it.\n  hub[consumers].push({ next: next, state: initial })\n  // If source is not in the process of consumption than\n  // start it up.\n  if (!isOpen(hub)) open(hub)\n}\nmodule.exports = hub\n\n//@ sourceURL=/node_modules/reducers/hub.js"
));

require.define("/node_modules/reducers/accumulate.js",Function(['require','module','exports','__dirname','__filename','process','global'],"\"use strict\";\n\nvar Method = require(\"method\")\nvar end = require(\"./end\")\nvar accumulated = require(\"./accumulated\")\nvar Eventual = require(\"eventual/type\")\nvar when = require(\"eventual/when\")\nvar error = require(\"./error\")\n\nvar accumulate = Method()\n\n// Implementation of accumulate for the empty sequences, that immediately\n// signals end of sequence.\naccumulate.empty = function accumulateEmpty(empty, next, start) {\n  next(end(), start)\n}\n// Implementation of accumulate for the singular values which are treated\n// as sequences with single element. Yields the given value and signals\n// the end of sequence.\naccumulate.singular = function accumulateSingular(value, next, start) {\n  next(end(), next(value, start))\n}\n// Implementation accumulate for the array (and alike) values, such that it\n// will call accumulator function `next` each time with next item and\n// accumulated state until it's exhausted or `next` returns marked value\n// indicating that it's done accumulating. Either way signals end to\n// an accumulator.\naccumulate.indexed = function accumulateIndexed(indexed, next, initial) {\n  var state = initial, index = 0, count = indexed.length\n  while (index < count) {\n    state = next(indexed[index++], state)\n    if (state && state.is === accumulated) break\n  }\n  next(end(), state)\n}\n\n// Both `undefined` and `null` implement accumulate for empty sequences.\naccumulate.define(void(0), accumulate.empty)\naccumulate.define(null, accumulate.empty)\n\n// Array and arguments implement accumulate for indexed sequences.\naccumulate.define(Array, accumulate.indexed)\naccumulate.define((function() { return arguments })(), accumulate.indexed)\n\n// All other built-in data structures are treated as single value sequences\n// by default. Of course individual types may choose to override that.\naccumulate.define(accumulate.singular)\n\n// All eventual values are treated as a single value of sequences, of\n// the value they realize to.\naccumulate.define(Eventual, function(eventual, next, initial) {\n  return when(eventual, function delivered(value) {\n    return accumulate(value, next, initial)\n  }, function failed(failure) {\n    next(end(), next(error(failure), initial))\n  })\n})\n\nmodule.exports = accumulate\n\n//@ sourceURL=/node_modules/reducers/accumulate.js"
));

require.define("/node_modules/reducers/node_modules/method/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"./core.js\"}\n//@ sourceURL=/node_modules/reducers/node_modules/method/package.json"
));

require.define("/node_modules/reducers/node_modules/method/core.js",Function(['require','module','exports','__dirname','__filename','process','global'],"/* vim:set ts=2 sw=2 sts=2 expandtab */\n/*jshint asi: true undef: true es5: true node: true browser: true devel: true\n         forin: true latedef: false globalstrict: true */\n'use strict';\n\n// Shortcuts for ES5 reflection functions.\nvar make = Object.create || (function() {\n  var Type = function Type() {}\n  return function make(prototype) {\n    Type.prototype = prototype\n    return new Type()\n  }\n})\nvar defineProperty = Object.defineProperty || function(object, name, property) {\n  object[name] = property.value\n  return object\n}\nvar typefy = Object.prototype.toString\n\nfunction Method(base) {\n  /**\n  Private Method is a callable private name that dispatches on the first\n  arguments same named Method: Method(...rest) => rest[0][Method](...rest)\n  Default implementation may be passed in as an argument.\n  **/\n\n  // Create an internal unique name if default implementation is passed,\n  // use it's name as a name hint.\n  var name = (base && base.name || \"\") + Math.random().toString(32).substr(2)\n\n  function dispatch() {\n    // Method dispatches on type of the first argument.\n    var target = arguments[0]\n    var builtin = null\n    // If first argument is `null` or `undefined` use associated property\n    // maps for implementation lookups, otherwise attempt to use implementation\n    // for built-in falling back for implementation on the first argument.\n    // Finally use default implementation if no other one is found.\n    var method = target === null ? Null[name] :\n                 target === undefined ? Undefined[name] :\n                 target[name] ||\n                 ((builtin = Builtins[typefy.call(target)]) && builtin[name]) ||\n                 Builtins.Object[name] ||\n                 Default[name]\n\n    // If implementation not found there's not much we can do about it,\n    // throw error with a descriptive message.\n    if (!method) throw Error('Type does not implements method')\n\n    // If implementation is found delegate to it.\n    return method.apply(method, arguments)\n  }\n\n  // Define default implementation.\n  Default[name] = base\n\n  // Define `Method.toString` returning private name, this hack will enable\n  // Method definition like follows:\n  // var foo = Method()\n  // object[foo] = function() { /***/ }\n  dispatch.toString = function toString() { return name }\n\n  // Copy utility Methods for convenient API.\n  dispatch.implement = implementMethod\n  dispatch.define = defineMethod\n\n  return dispatch\n}\n\n// Define objects where Methods implementations for `null`, `undefined` and\n// defaults will be stored.\nvar Default = {}\nvar Null = make(Default)\nvar Undefined = make(Default)\n// Implementation for built-in types are stored in the hash, this avoids\n// mutations on built-ins and allows cross frame extensions. Primitive types\n// are predefined so that `Object` extensions won't be inherited.\nvar Builtins = {\n  Object: make(Default),\n  Number: make(Default),\n  String: make(Default),\n  Boolean: make(Default)\n}\n// Define aliases for predefined built-in maps to a forms that values will\n// be serialized on dispatch.\nBuiltins[typefy.call(Object.prototype)] = Builtins.Object\nBuiltins[typefy.call(Number.prototype)] = Builtins.Number\nBuiltins[typefy.call(String.prototype)] = Builtins.String\n\n\n\nvar implement = Method(\nfunction implement(method, object, lambda) {\n  /**\n  Implements `Method` for the given `object` with a provided `implementation`.\n  Calling `Method` with `object` as a first argument will dispatch on provided\n  implementation.\n  **/\n  var target = object === null ? Null :\n               object === undefined ? Undefined :\n               object\n\n  return defineProperty(target, method.toString(), {\n    enumerable: false,\n    configurable: false,\n    writable: false,\n    value: lambda\n  })\n})\n\nvar define = Method(function define(method, Type, lambda) {\n  /**\n  Defines `Method` for the given `Type` with a provided `implementation`.\n  Calling `Method` with a first argument of this `Type` will dispatch on\n  provided `implementation`. If `Type` is a `Method` default implementation\n  is defined. If `Type` is a `null` or `undefined` `Method` is implemented\n  for that value type.\n  **/\n  if (!lambda) return implement(method, Default, Type)\n  if (!Type) return implement(method, Type, lambda)\n  var type = typefy.call(Type.prototype)\n  return type !== \"[object Object]\" ? implement(method,\n      Builtins[type] || (Builtins[type] = make(Builtins.Object)), lambda) :\n    // This should be `Type === Object` but since it will be `false` for\n    // `Object` from different JS context / compartment / frame we assume that\n    // if it's name is `Object` it is Object.\n    Type.name === \"Object\" ? implement(method, Builtins.Object, lambda) :\n    implement(method, Type.prototype, lambda)\n})\n\nvar defineMethod = function defineMethod(Type, lambda) {\n  return define(this, Type, lambda)\n}\nvar implementMethod = function implementMethod(object, lambda) {\n  return implement(this, object, lambda)\n}\n\n\n// Define exports on `Method` as it's only thing we export.\nMethod.implement = implement\nMethod.define = define\nMethod.Method = Method\nMethod.Null = Null\nMethod.Undefined = Undefined\nMethod.Default = Default\nMethod.Builtins = Builtins\n\nmodule.exports = Method\n\n//@ sourceURL=/node_modules/reducers/node_modules/method/core.js"
));

require.define("/node_modules/reducers/end.js",Function(['require','module','exports','__dirname','__filename','process','global'],"\"use strict\";\n\nvar Box = require(\"./box\")\n\n// Exported function can be used for boxing values. This boxing is used by\n// `accumulate` function to message end of the sequence.\nmodule.exports = Box(\"End of the sequence\")\n\n//@ sourceURL=/node_modules/reducers/end.js"
));

require.define("/node_modules/reducers/box.js",Function(['require','module','exports','__dirname','__filename','process','global'],"\"use strict\";\n\nmodule.exports = function Box(description) {\n  /**\n  Create a \"boxed\" value.\n  Boxed values may be used as flags to signify a mode or value.\n  This is similar to the way some languages use magic constants to trigger\n  a specific behavior or mode.\n\n  Boxed values may have a description that explains how they are to be used.\n  \n  Returns a box object.\n  **/\n  description = description || \"Boxed value\"\n  return function box(value) {\n    return {\n      isBoxed: true,\n      is: box,\n      value: value,\n      description: description\n    }\n  }\n}\n\n//@ sourceURL=/node_modules/reducers/box.js"
));

require.define("/node_modules/reducers/accumulated.js",Function(['require','module','exports','__dirname','__filename','process','global'],"\"use strict\";\n\nvar Box = require(\"./box\")\n\n// Exported function can be used for boxing values. This boxing indicates\n// that consumer of sequence has finished consuming it, there for new values\n// should not be no longer pushed.\nvar accumulated = Box(\"Indicator that source has being accumulateed\")\n\nmodule.exports = accumulated\n\n//@ sourceURL=/node_modules/reducers/accumulated.js"
));

require.define("/node_modules/reducers/node_modules/eventual/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {}\n//@ sourceURL=/node_modules/reducers/node_modules/eventual/package.json"
));

require.define("/node_modules/reducers/node_modules/eventual/type.js",Function(['require','module','exports','__dirname','__filename','process','global'],"\"use strict\";\n\nvar watchers = require(\"watchables/watchers\")\nvar watch = require(\"watchables/watch\")\nvar await = require(\"pending/await\")\nvar isPending = require(\"pending/is\")\nvar deliver = require(\"./deliver\")\nvar when = require(\"./when\")\n\n// Internal utility function returns true if given value is of error type,\n// otherwise returns false.\nvar isError = (function() {\n  var stringy = Object.prototype.toString\n  var error = stringy.call(Error.prototype)\n  return function isError(value) {\n    return stringy.call(value) === error\n  }\n})()\n\n// Internal utility, identity function. Returns whatever is given to it.\nfunction identity(value) { return value }\n\n// Internal utility, decorator function that wraps given function into\n// try / catch and returns thrown exception in case when exception is\n// thrown.\nfunction attempt(f) {\n  return function effort(value) {\n    try { return f(value) }\n    catch (error) { return error }\n  }\n}\n\n\n// Define property names used by an `Eventual` type. Names are prefixed via\n// `module.id` to avoid name conflicts.\nvar observers = \"observers@\" + module.id\nvar result = \"value@\" + module.id\nvar pending = \"pending@\" + module.id\n\n\nfunction Eventual() {\n  /**\n  Data type representing eventual value, that can be observed and delivered.\n  Type implements `watchable`, `pending` and `eventual` abstractions, where\n  first two are defined in an external libraries.\n  **/\n  this[observers] = []\n  this[result] = this\n  this[pending] = true\n}\n// Expose property names via type static properties so that it's easier\n// to refer to them while debugging.\nEventual.observers = observers\nEventual.result = result\nEventual.pending = pending\n\nwatchers.define(Eventual, function(value) {\n  return value[observers]\n})\n// Eventual values considered to be pending until the are deliver by calling\n// `deliver`. Internal `pending` property is used to identify weather value\n// is being watched or not.\nisPending.define(Eventual, function(value) {\n  return value[pending]\n})\n// Eventual type implements await function of pending abstraction, to enable\n// observation of value delivery.\nawait.define(Eventual, function(value, observer) {\n  if (isPending(value)) watch(value, observer)\n  else observer(value[result])\n})\n\n// Eventual implements `deliver` function of pending abstraction, to enable\n// fulfillment of eventual values. Eventual value can be delivered only once,\n// which will transition it from pending state to non-pending state. All\n// further deliveries are ignored. It's also guaranteed that all the registered\n// observers will be invoked in FIFO order.\ndeliver.define(Eventual, function(value, data) {\n  // Ignore delivery if value is no longer pending, or if it's in a process of\n  // delivery (in this case eventual[result] is set to value other than\n  // eventual itself). Also ignore if data deliver is value itself.\n  if (value !== data && isPending(value) && value[result] === value) {\n    var count = 0\n    var index = 0\n    var delivering = true\n    var observers = void(0)\n    // Set eventual value result to passed data value that also marks value\n    // as delivery in progress. This way all the `deliver` calls is side\n    // effect to this will be ignored. Note: value should still remain pending\n    // so that new observers could be registered instead of being called\n    // immediately, otherwise it breaks FIFO order.\n    value[result] = data\n    while (delivering) {\n      // If current batch of observers is exhausted, splice a new batch\n      // and continue delivery. New batch is created only if new observers\n      // are registered in side effect to this call of deliver.\n      if (index === count) {\n        observers = watchers(value).splice(0)\n        count = observers.length\n        index = 0\n        // If new observers have not being registered mark value as no longer\n        // pending and finish delivering.\n        if (count === index) {\n          value[pending] = false\n          delivering = false\n        }\n      }\n      // Register await handlers on given result, is it may be eventual /\n      // pending itself. Delivering eventual will cause delivery of the\n      // delivered eventual's delivery value, whenever that would be.\n      else {\n        await(data, observers[index])\n        index = index + 1\n      }\n    }\n  }\n})\n\n// Eventual implements `when` polymorphic function that is part of it's own\n// abstraction. It takes `value` `onFulfill` & `onError` handlers. In return\n// when returns eventual value, that is delivered return value of the handler\n// that is invoked depending on the given values delivery. If deliver value\n// is of error type error handler is invoked. If value is delivered with other\n// non-pending value that is not of error type `onFulfill` handlers is invoked\n// with it. If pending value is delivered then it's value will be delivered\n// it's result whenever that would be. This will cause both value and error\n// propagation.\nwhen.define(Eventual, function(value, onRealize, onError) {\n  // Create eventual value for a return value.\n  var delivered = false\n  var eventual = void(0)\n  var result = void(0)\n  // Wrap handlers into attempt decorator function, so that in case of\n  // exception thrown error is returned causing error propagation. If handler\n  // is missing identity function is used instead to propagate value / error.\n  var realize = onRealize ? attempt(onRealize) : identity\n  var error = onError ? attempt(onError) : identity\n  // Wait for pending value to be delivered.\n  await(value, function onDeliver(data) {\n    // Once value is delivered invoke appropriate handler, and deliver it\n    // to a resulting eventual value.\n    result = isError(data) ? error(data)\n                           : realize(data)\n\n    // If outer function is already returned and has created eventual\n    // for it's result deliver it. Otherwise (if await called observer\n    // in same synchronously) mark result delivered.\n    if (eventual) deliver(eventual, result)\n    else delivered = true\n  })\n\n  // If result is delivered already return it, otherwise create eventual\n  // value for the result and return that.\n  return delivered ? result : (eventual = new Eventual())\n})\n\nmodule.exports = Eventual\n\n//@ sourceURL=/node_modules/reducers/node_modules/eventual/type.js"
));

require.define("/node_modules/reducers/node_modules/eventual/node_modules/watchables/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {}\n//@ sourceURL=/node_modules/reducers/node_modules/eventual/node_modules/watchables/package.json"
));

require.define("/node_modules/reducers/node_modules/eventual/node_modules/watchables/watchers.js",Function(['require','module','exports','__dirname','__filename','process','global'],"/*jshint asi: true undef: true es5: true node: true devel: true\n         globalstrict: true forin: true latedef: false supernew: true */\n/*global define: true */\n\n\"use strict\";\n\nvar Method = require('method')\n\n// Method is supposed to return array of watchers for the given\n// value.\nmodule.exports = Method()\n\n//@ sourceURL=/node_modules/reducers/node_modules/eventual/node_modules/watchables/watchers.js"
));

require.define("/node_modules/reducers/node_modules/eventual/node_modules/watchables/watch.js",Function(['require','module','exports','__dirname','__filename','process','global'],"/*jshint asi: true undef: true es5: true node: true devel: true\n         globalstrict: true forin: true latedef: false supernew: true */\n/*global define: true */\n\n\"use strict\";\n\nvar Method = require('method')\nvar watchers = require('./watchers')\n\nmodule.exports = Method(function(value, watcher) {\n  // Registers a `value` `watcher`, unless it's already registered.\n  var registered = watchers(value)\n  if (registered && registered.indexOf(watcher) < 0)\n    registered.push(watcher)\n  return value\n})\n\n//@ sourceURL=/node_modules/reducers/node_modules/eventual/node_modules/watchables/watch.js"
));

require.define("/node_modules/reducers/node_modules/eventual/node_modules/pending/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {}\n//@ sourceURL=/node_modules/reducers/node_modules/eventual/node_modules/pending/package.json"
));

require.define("/node_modules/reducers/node_modules/eventual/node_modules/pending/await.js",Function(['require','module','exports','__dirname','__filename','process','global'],"/*jshint asi: true undef: true es5: true node: true devel: true\n         globalstrict: true forin: true latedef: false supernew: true */\n/*global define: true */\n\n\"use strict\";\n\nvar Method = require('method')\n\n// Set's up a callback to be called once pending\n// value is realized. All object by default are realized.\nmodule.exports = Method(function(value, callback) {\n  callback(value)\n})\n\n//@ sourceURL=/node_modules/reducers/node_modules/eventual/node_modules/pending/await.js"
));

require.define("/node_modules/reducers/node_modules/eventual/node_modules/pending/is.js",Function(['require','module','exports','__dirname','__filename','process','global'],"/*jshint asi: true undef: true es5: true node: true devel: true\n         globalstrict: true forin: true latedef: false supernew: true */\n/*global define: true */\n\n\"use strict\";\n\nvar Method = require('method')\n\n// Returns `true` if given `value` is pending, otherwise returns\n// `false`. All types will return false unless type specific\n// implementation is provided to do it otherwise.\nmodule.exports = Method(function() {\n  return false\n})\n\n//@ sourceURL=/node_modules/reducers/node_modules/eventual/node_modules/pending/is.js"
));

require.define("/node_modules/reducers/node_modules/eventual/deliver.js",Function(['require','module','exports','__dirname','__filename','process','global'],"\"use strict\";\n\n// Anyone crating an eventual will likely need to realize it, requiring\n// dependency on other package is complicated, not to mention that one\n// can easily wind up with several copies that does not necessary play\n// well with each other. Exposing this solves the issues.\nmodule.exports = require(\"pending/deliver\")\n\n//@ sourceURL=/node_modules/reducers/node_modules/eventual/deliver.js"
));

require.define("/node_modules/reducers/node_modules/eventual/node_modules/pending/deliver.js",Function(['require','module','exports','__dirname','__filename','process','global'],"/*jshint asi: true undef: true es5: true node: true devel: true\n         globalstrict: true forin: true latedef: false supernew: true */\n/*global define: true */\n\n\"use strict\";\n\nvar Method = require('method')\n// Method delivers pending value.\nmodule.exports = Method()\n\n//@ sourceURL=/node_modules/reducers/node_modules/eventual/node_modules/pending/deliver.js"
));

require.define("/node_modules/reducers/node_modules/eventual/when.js",Function(['require','module','exports','__dirname','__filename','process','global'],"\"use strict\";\n\nvar Method = require(\"method\")\nvar when = Method(function(value, onRealize) {\n  return typeof(onRealize) === \"function\" ? onRealize(value) : value\n})\nwhen.define(Error, function(error, onRealize, onError) {\n  return typeof(onError) === \"function\" ? onError(error) : error\n})\n\nmodule.exports = when\n\n//@ sourceURL=/node_modules/reducers/node_modules/eventual/when.js"
));

require.define("/node_modules/reducers/error.js",Function(['require','module','exports','__dirname','__filename','process','global'],"\"use strict\";\n\nvar Box = require(\"./box\")\n\n// Exported function can be used for boxing values. This boxing can be used\n// to identify errors.\nmodule.exports = Box(\"Error in the sequence\")\n\n//@ sourceURL=/node_modules/reducers/error.js"
));

require.define("/node_modules/reducers/convert.js",Function(['require','module','exports','__dirname','__filename','process','global'],"\"use strict\";\n\nvar accumulate = require(\"./accumulate\")\nvar make = Object.create || (function() {\n  function Type() {}\n  return function make(prototype) {\n    Type.prototype = prototype\n    return new Type()\n  }\n})()\n\n\nfunction convert(source, method) {\n  /**\n  Function takes `source` sequence and returns new `sequence` such\n  that calling `accumulate` on it will delegate to given `method`.\n  This is to make sequence conversions lazy.\n\n  // Code will produce sequence that is just like `source` but with\n  // each element being incremented.\n  function increment(source) {\n    return convert(source, function(sequence, f, start) {\n      return accumulate(source, function(value, result) {\n        return f(value + 1, result)\n      }, start)\n    })\n  }\n  into(increment([ 1, 2, 3 ])) => [ 2, 3, 4 ]\n  **/\n  var base = typeof(source) === \"object\" ? make(source) : {}\n  return accumulate.implement(base, method)\n}\n\nmodule.exports = convert\n\n//@ sourceURL=/node_modules/reducers/convert.js"
));

require.define("/node_modules/reducers/signal.js",Function(['require','module','exports','__dirname','__filename','process','global'],"\"use strict\";\n\nvar Method = require(\"method\")\nvar accumulate = require(\"./accumulate\")\nvar end = require(\"./end\")\nvar accumulated = require(\"./accumulated\")\nvar emit = require(\"./emit\")\nvar close = require(\"./close\")\n\nvar accumulator = \"accumulator@\" + module.id\nvar state = \"state@\" + module.id\nvar closed = \"closed@\" + module.id\n\n// Define a `Signal` data-type. A signal is a sequence of \"events over time\".\n// \n// Signals are a building block for creating Reactive event-driven programs.\n// \n// If you're familiar with libraries like Node EventEmitter, you might have\n// an easy time thinking of Signal as a single event channel. The key difference\n// is that signal represents events-over-time as a reducible value. This means\n// the events-over-time can be transformed, filtered forked and joined just like\n// an array.\nfunction Signal() {}\n\n// Signals can be either open or closed. An open signal may `emit` new values.\n// A signal that is not open may not emit.\n// \n// Define helper that allow you to test the state of a signal.\nfunction isClosed(signal) {\n  return !!signal[closed]\n}\nfunction isOpen(signal) {\n  return !!signal[accumulator]\n}\n\n// Implement accumulate protocol on signals, making them reducible.\naccumulate.define(Signal, function(signal, next, initial) {\n  // Signals may only be reduced by one consumer function.\n  // Other data types built on top of signal may allow for more consumers.\n  if (isOpen(signal)) throw Error(\"Signal is being consumed\")\n  if (isClosed(signal)) return next(end(), initial)\n  signal[accumulator] = next\n  signal[state] = initial\n  return signal\n})\n\nemit.define(Signal, function(signal, value) {\n  /**\n  Emit a new value for signal.\n  Throws an exception if the signal is not open for emitting.\n  **/\n  if (isClosed(signal)) throw Error(\"Signal is already closed\")\n  if (!isOpen(signal)) throw Error(\"Signal is not open\")\n  var result = signal[accumulator](value, signal[state])\n  if (result && result.is === accumulated) {\n    close(signal)\n  } else {\n    signal[state] = result\n  }\n  return signal\n})\n\nclose.define(Signal, function(signal, value) {\n  /**\n  Close a signal, preventing new values from being emitted.\n  Throws an exception if the signal is already closed.\n  **/\n  if (isClosed(signal)) throw Error(\"Signal is already closed\")\n  if (value !== undefined) emit(signal, value)\n  var result = signal[state]\n  var next = signal[accumulator]\n  signal[closed] = true\n  signal[accumulator] = null\n  signal[state] = null\n  next(end(), result)\n\n  return signal\n})\n\n// Define a factory function for the `Signal` constructor.\n// Assign other signal functions to the factory function object and export\n// the result.\nfunction signal() { return new Signal() }\nsignal.type = Signal\nsignal.isOpen = isOpen\nsignal.isClosed = isClosed\nsignal.emit = emit\nsignal.close = close\n\nmodule.exports = signal\n\n//@ sourceURL=/node_modules/reducers/signal.js"
));

require.define("/node_modules/reducers/emit.js",Function(['require','module','exports','__dirname','__filename','process','global'],"\"use strict\";\n\nvar Method = require(\"method\")\n\nvar emit = Method()\n\nmodule.exports = emit\n\n//@ sourceURL=/node_modules/reducers/emit.js"
));

require.define("/node_modules/reducers/close.js",Function(['require','module','exports','__dirname','__filename','process','global'],"\"use strict\";\n\nvar Method = require(\"method\")\n\n\nvar close = Method()\nmodule.exports = close\n\n//@ sourceURL=/node_modules/reducers/close.js"
));

require.define("/lib/pipe.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var reduce = require(\"reducers/reduce\")\nvar emit = require(\"reducers/emit\")\n\nmodule.exports = pipe\n\nfunction pipe(input, output) {\n    reduce(input, function(_, x) {\n        emit(output, x)\n    })\n}\n\n//@ sourceURL=/lib/pipe.js"
));

require.define("/node_modules/reducers/reduce.js",Function(['require','module','exports','__dirname','__filename','process','global'],"\"use strict\";\n\nvar deliver = require(\"eventual/deliver\")\nvar defer = require(\"eventual/defer\")\nvar when = require(\"eventual/when\")\nvar accumulate = require(\"./accumulate\")\nvar end = require(\"./end\")\nvar error = require(\"./error\")\n\nfunction reduce(source, f, state) {\n  var promise = defer()\n  accumulate(source, function(value) {\n    if (value && value.isBoxed) {\n      if (value.is === end) deliver(promise, state)\n      if (value.is === error) deliver(promise, value.value)\n      return value\n    } else {\n      state = f(state, value)\n      return state\n    }\n  }, state)\n  return when(promise)\n}\n\nmodule.exports = reduce\n\n//@ sourceURL=/node_modules/reducers/reduce.js"
));

require.define("/node_modules/reducers/node_modules/eventual/defer.js",Function(['require','module','exports','__dirname','__filename','process','global'],"\"use strict\";\n\nvar Eventual = require(\"./type\")\nmodule.exports = function defer() { return new Eventual() }\n\n//@ sourceURL=/node_modules/reducers/node_modules/eventual/defer.js"
));

require.define("/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"index\"}\n//@ sourceURL=/package.json"
));

require.define("/persist.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var Store = require(\"local-store\")\n    , reductions = require(\"reducers/reductions\")\n    , patch = require(\"diffpatcher/patch\")\n    , compose = require(\"composite\")\n\n    , state = require(\"./reflex/state\")\n    , Writer = require(\"./reflex/writer\")\n\n/*\n    The persistance is a composition of a\n\n        - fork (fork the changes into states)\n        - writer. Open the store & write to it for each new\n            state\n        - reader. Return the initial state\n*/\nmodule.exports = compose(read, Writer(swap, open), states)\n\nfunction read(store) {\n    return store.get(\"state\")\n}\n\nfunction swap(store, current) {\n    delete current.operation\n    store.set(\"state\", current)\n}\n\nfunction open() {\n    return Store(\"reflex-todo\")\n}\n\nfunction states(changes) {\n    return reductions(changes, patch, state())\n}\n\n//@ sourceURL=/persist.js"
));

require.define("/node_modules/local-store/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"index\"}\n//@ sourceURL=/node_modules/local-store/package.json"
));

require.define("/node_modules/local-store/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var LocalStorage = typeof window !== \"undefined\" && window.localStorage\n    , prefixes = {}\n    , store\n\nif (LocalStorage) {\n    store = createLocalStore\n} else {\n    store = createMemoryStore\n}\n\nstore.createMemoryStore = createMemoryStore\nstore.createLocalStore = createLocalStore\n\nmodule.exports = store\n\nfunction createLocalStore(prefix) {\n    prefix = prefix || \"\"\n\n    return {\n        set: storeSet\n        , get: storeGet\n        , delete: storeDelete\n    }\n\n    function storeSet(key, value) {\n        LocalStorage.setItem(prefix + \".\" + key, JSON.stringify(value))\n    }\n\n    function storeGet(key) {\n        var str = LocalStorage.getItem(prefix + \".\" + key)\n        if (str === null) {\n            return null\n        }\n        return JSON.parse(str)\n    }\n\n    function storeDelete(key) {\n        return LocalStorage.removeItem(prefix + \".\" + key)\n    }\n}\n\nfunction createMemoryStore(prefix) {\n    var store = {}\n    if (prefix) {\n        store = prefixes[prefix]\n\n        if (!store) {\n            store = prefixes[prefix] = {}\n        }\n    }\n\n    return {\n        set: storeSet\n        , get: storeGet\n        , delete: storeDelete\n    }\n\n    function storeSet(key, value) {\n        store[key] = value\n    }\n\n    function storeGet(key) {\n        if (!(key in store)) {\n            return null\n        }\n\n        return store[key]\n    }\n\n    function storeDelete(key) {\n        return delete store[key]\n    }\n}\n//@ sourceURL=/node_modules/local-store/index.js"
));

require.define("/node_modules/reducers/reductions.js",Function(['require','module','exports','__dirname','__filename','process','global'],"\"use strict\";\n\nvar convert = require(\"./convert\")\nvar accumulate = require(\"./accumulate\")\n\nfunction reductions(source, f, initial) {\n  /**\n  Returns `reducible` collection of the intermediate values of the reduction\n  (as per reduce) of `source` by `f`, starting with `initial` value.\n\n  ## Example\n\n  var numbers = reductions([1, 1, 1, 1], function(accumulated, value) {\n    return accumulated + value\n  }, 0)\n  print(numbers) // => <stream 1 2 3 4 />\n  **/\n  return convert(source, function(self, next, result) {\n    var state = initial\n    accumulate(source, function(value, result) {\n      state = value && value.isBoxed ? next(value, result) : f(state, value)\n      return next(state, result)\n    }, result)\n  })\n}\n\nmodule.exports = reductions\n\n//@ sourceURL=/node_modules/reducers/reductions.js"
));

require.define("/node_modules/diffpatcher/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"./diffpatcher.js\"}\n//@ sourceURL=/node_modules/diffpatcher/package.json"
));

require.define("/node_modules/diffpatcher/patch.js",Function(['require','module','exports','__dirname','__filename','process','global'],"/* vim:set ts=2 sw=2 sts=2 expandtab */\n/*jshint asi: true undef: true es5: true node: true browser: true devel: true\n         forin: true latedef: false globalstrict: true*/\n\n\"use strict\";\n\nvar method = require(\"method\")\nvar rebase = require(\"./rebase\")\n\n// Method is designed to work with data structures representing application\n// state. Calling it with a state and delta should return object representing\n// new state, with changes in `delta` being applied to previous.\n//\n// ## Example\n//\n// patch(state, {\n//   \"item-id-1\": { completed: false }, // update\n//   \"item-id-2\": null                  // delete\n// })\nvar patch = method()\npatch.define(Object, function patch(hash, delta) {\n  return rebase({}, hash, delta)\n})\n\nmodule.exports = patch\n\n//@ sourceURL=/node_modules/diffpatcher/patch.js"
));

require.define("/node_modules/diffpatcher/node_modules/method/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"./core.js\"}\n//@ sourceURL=/node_modules/diffpatcher/node_modules/method/package.json"
));

require.define("/node_modules/diffpatcher/node_modules/method/core.js",Function(['require','module','exports','__dirname','__filename','process','global'],"/* vim:set ts=2 sw=2 sts=2 expandtab */\n/*jshint asi: true undef: true es5: true node: true browser: true devel: true\n         forin: true latedef: false globalstrict: true */\n'use strict';\n\n// Shortcuts for ES5 reflection functions.\nvar make = Object.create || (function() {\n  var Type = function Type() {}\n  return function make(prototype) {\n    Type.prototype = prototype\n    return new Type()\n  }\n})\nvar defineProperty = Object.defineProperty || function(object, name, property) {\n  object[name] = property.value\n  return object\n}\nvar typefy = Object.prototype.toString\n\nfunction Method(base) {\n  /**\n  Private Method is a callable private name that dispatches on the first\n  arguments same named Method: Method(...rest) => rest[0][Method](...rest)\n  Default implementation may be passed in as an argument.\n  **/\n\n  // Create an internal unique name if default implementation is passed,\n  // use it's name as a name hint.\n  var name = (base && base.name || \"\") + Math.random().toString(32).substr(2)\n\n  function dispatch() {\n    // Method dispatches on type of the first argument.\n    var target = arguments[0]\n    var builtin = null\n    // If first argument is `null` or `undefined` use associated property\n    // maps for implementation lookups, otherwise attempt to use implementation\n    // for built-in falling back for implementation on the first argument.\n    // Finally use default implementation if no other one is found.\n    var method = target === null ? Null[name] :\n                 target === undefined ? Undefined[name] :\n                 target[name] ||\n                 ((builtin = Builtins[typefy.call(target)]) && builtin[name]) ||\n                 Builtins.Object[name] ||\n                 Default[name]\n\n    // If implementation not found there's not much we can do about it,\n    // throw error with a descriptive message.\n    if (!method) throw Error('Type does not implements method')\n\n    // If implementation is found delegate to it.\n    return method.apply(method, arguments)\n  }\n\n  // Define default implementation.\n  Default[name] = base\n\n  // Define `Method.toString` returning private name, this hack will enable\n  // Method definition like follows:\n  // var foo = Method()\n  // object[foo] = function() { /***/ }\n  dispatch.toString = function toString() { return name }\n\n  // Copy utility Methods for convenient API.\n  dispatch.implement = implementMethod\n  dispatch.define = defineMethod\n\n  return dispatch\n}\n\n// Define objects where Methods implementations for `null`, `undefined` and\n// defaults will be stored.\nvar Default = {}\nvar Null = make(Default)\nvar Undefined = make(Default)\n// Implementation for built-in types are stored in the hash, this avoids\n// mutations on built-ins and allows cross frame extensions. Primitive types\n// are predefined so that `Object` extensions won't be inherited.\nvar Builtins = {\n  Object: make(Default),\n  Number: make(Default),\n  String: make(Default),\n  Boolean: make(Default)\n}\n// Define aliases for predefined built-in maps to a forms that values will\n// be serialized on dispatch.\nBuiltins[typefy.call(Object.prototype)] = Builtins.Object\nBuiltins[typefy.call(Number.prototype)] = Builtins.Number\nBuiltins[typefy.call(String.prototype)] = Builtins.String\n\n\n\nvar implement = Method(\nfunction implement(method, object, lambda) {\n  /**\n  Implements `Method` for the given `object` with a provided `implementation`.\n  Calling `Method` with `object` as a first argument will dispatch on provided\n  implementation.\n  **/\n  var target = object === null ? Null :\n               object === undefined ? Undefined :\n               object\n\n  return defineProperty(target, method.toString(), {\n    enumerable: false,\n    configurable: false,\n    writable: false,\n    value: lambda\n  })\n})\n\nvar define = Method(function define(method, Type, lambda) {\n  /**\n  Defines `Method` for the given `Type` with a provided `implementation`.\n  Calling `Method` with a first argument of this `Type` will dispatch on\n  provided `implementation`. If `Type` is a `Method` default implementation\n  is defined. If `Type` is a `null` or `undefined` `Method` is implemented\n  for that value type.\n  **/\n  if (!lambda) return implement(method, Default, Type)\n  if (!Type) return implement(method, Type, lambda)\n  var type = typefy.call(Type.prototype)\n  return type !== \"[object Object]\" ? implement(method,\n      Builtins[type] || (Builtins[type] = make(Builtins.Object)), lambda) :\n    // This should be `Type === Object` but since it will be `false` for\n    // `Object` from different JS context / compartment / frame we assume that\n    // if it's name is `Object` it is Object.\n    Type.name === \"Object\" ? implement(method, Builtins.Object, lambda) :\n    implement(method, Type.prototype, lambda)\n})\n\nvar defineMethod = function defineMethod(Type, lambda) {\n  return define(this, Type, lambda)\n}\nvar implementMethod = function implementMethod(object, lambda) {\n  return implement(this, object, lambda)\n}\n\n\n// Define exports on `Method` as it's only thing we export.\nMethod.implement = implement\nMethod.define = define\nMethod.Method = Method\nMethod.Null = Null\nMethod.Undefined = Undefined\nMethod.Default = Default\nMethod.Builtins = Builtins\n\nmodule.exports = Method\n\n//@ sourceURL=/node_modules/diffpatcher/node_modules/method/core.js"
));

require.define("/node_modules/diffpatcher/rebase.js",Function(['require','module','exports','__dirname','__filename','process','global'],"/* vim:set ts=2 sw=2 sts=2 expandtab */\n/*jshint asi: true undef: true es5: true node: true browser: true devel: true\n         eqnull: true forin: true latedef: false globalstrict: true*/\n\n\"use strict\";\n\nfunction rebase(result, parent, delta) {\n  Object.keys(parent).forEach(function(key) {\n    // If `parent[key]` is `null` it means attribute was deleted in previous\n    // update. We skip such properties as there is no use in keeping them\n    // around. If `delta[key]` is `null` we skip these properties too as\n    // the have being deleted.\n    if (!(parent[key] == null || (key in delta && delta[key] == null)))\n      result[key] = parent[key]\n  }, result)\n  Object.keys(delta).forEach(function(key) {\n    if (key in parent) {\n      var current = delta[key]\n      var previous = parent[key]\n      if (current === previous) current = current\n      // If `delta[key]` is `null` it's delete so we just skip property.\n      else if (current == null) current = current\n      // If value is of primitive type (function or regexps should not\n      // even be here) we just update in place.\n      else if (typeof(current) !== \"object\") result[key] = current\n      // If previous value associated with this key was primitive\n      // and it's mapped to non primitive\n      else if (typeof(previous) !== \"object\") result[key] = current\n      else result[key] = rebase({}, previous, current)\n    } else {\n      result[key] = delta[key]\n    }\n  })\n  return result\n}\n\nmodule.exports = rebase\n\n//@ sourceURL=/node_modules/diffpatcher/rebase.js"
));

require.define("/node_modules/composite/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"index\"}\n//@ sourceURL=/node_modules/composite/package.json"
));

require.define("/node_modules/composite/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"\"use strict\";\n\nvar partial = require(\"ap\").partial\n    , slice = Array.prototype.slice\n    , globalScope = typeof global === \"undefined\" ? window : global\n\ncompose.async = composeAsync\ncompose.cc = cc\n\nmodule.exports = compose\n\nfunction compose() {\n    return slice.call(arguments).reduce(combineFunctions)\n}\n\nfunction combineFunctions(memo, current) {\n    return partial(applyInOrder, current, memo)\n}\n   \nfunction applyInOrder(first, second) {\n    var result = first.apply(this, slice.call(arguments, 2))\n    if (Array.isArray(result)) {\n        return second.apply(this, result)\n    }\n    return second.call(this, result)\n}\n\nfunction composeAsync() {\n    return createAsyncComposite(slice.call(arguments))\n}\n\nfunction createAsyncComposite(fns) {\n    var index = fns.length - 1\n        , thisValue\n        , finishCallback\n\n    return callFirst\n\n    function callNext() {\n        var args = slice.call(arguments)\n            , f = fns[index--]\n            , functionIndex = f.length - 1\n            , callbackIndex = args.length\n\n        if (callbackIndex < functionIndex) {\n            callbackIndex = functionIndex\n        }\n\n        if (index === -1) {\n            args[callbackIndex] = finishCallback\n        } else {\n            args[callbackIndex] = callNext\n        }\n\n        f.apply(thisValue, args)\n    }\n\n    function callFirst() {\n        var args = slice.call(arguments)\n            , f = fns[index--]\n            , functionIndex = f.length - 1\n            , callbackIndex = args.length\n            , lastArg = args[callbackIndex - 1]\n\n        thisValue = this\n\n        if (typeof lastArg === \"function\") {\n            finishCallback = lastArg.bind(thisValue)\n            args.pop()\n            callbackIndex--\n        }\n\n        if (callbackIndex < functionIndex) {\n            callbackIndex = functionIndex\n        }\n\n        args[callbackIndex] = callNext\n\n        f.apply(thisValue, args)\n    }\n}\n\nfunction cc() {\n    var composite = composeAsync.apply(null, arguments)\n\n    return caller\n\n    function caller() {\n        var args = [].slice.call(arguments)\n        args.push(noop)\n        composite.apply({}, args)\n    }\n}\n\nfunction noop() {}\n//@ sourceURL=/node_modules/composite/index.js"
));

require.define("/node_modules/composite/node_modules/ap/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"./index.js\"}\n//@ sourceURL=/node_modules/composite/node_modules/ap/package.json"
));

require.define("/node_modules/composite/node_modules/ap/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"exports = module.exports = ap;\nfunction ap (args, fn) {\n    return function () {\n        return fn.apply(this, args.concat.apply(args, arguments));\n    };\n}\n\nexports.pa = pa;\nfunction pa (args, fn) {\n    return function () {\n        return fn.apply(this, [].slice.call(arguments).concat(args));\n    };\n}\n\nexports.apa = apa;\nfunction apa (left, right, fn) {\n    return function () {\n        return fn.apply(this,\n            left.concat.apply(left, arguments).concat(right)\n        );\n    };\n}\n\nexports.partial = partial;\nfunction partial (fn) {\n    var args = [].slice.call(arguments, 1);\n    return ap(args, fn);\n}\n\nexports.partialRight = partialRight;\nfunction partialRight (fn) {\n    var args = [].slice.call(arguments, 1);\n    return pa(args, fn);\n}\n\nexports.curry = curry;\nfunction curry (fn) {\n    return partial(partial, fn);\n}\n\nexports.curryRight = function curryRight (fn) {\n    return partial(partialRight, fn);\n}\n\n//@ sourceURL=/node_modules/composite/node_modules/ap/index.js"
));

require.define("/reflex/state.js",Function(['require','module','exports','__dirname','__filename','process','global'],"/* vim:set ts=2 sw=2 sts=2 expandtab */\n/*jshint asi: true undef: true es5: true node: true devel: true\n         forin: true latedef: false globalstrict: true*/\n/*global parent:true */\n\n\"use strict\";\n\nvar diff = require(\"diffpatcher/diff\")\nvar patch = require(\"diffpatcher/patch\")\nvar rebase = require(\"diffpatcher/rebase\")\nvar channel = require(\"reducers/channel\")\nvar timestamp = require(\"monotonic-timestamp\")\n\nvar make = Object.create || (function() {\n    function Type() {}\n    return function make(prototype) {\n        Type.prototype = prototype\n        return new Type()\n    }\n})()\n\n// Generated unique name is used to store `delta` on the state object\n// which is object containing changes from previous state to current.\nvar delta = \"delta@\" + module.id\nvar id = \"uuid@\" + module.id\nvar parent = \"parent@\" + module.id\n\n// State is a type used for representing application states. Primarily\n// reason to have a type is to have an ability implement polymorphic\n// methods for it.\nfunction State() {}\n\n// Returns diff that has being applied to a previous state to get to a\n// current one.\ndiff.define(State, function diff(from, to) {\n    // If state does not contains delta property then it's initial,\n    // so diff to get to the current state should be a diff itself.\n    if (to[parent] === from[id]) {\n        return to[delta]\n    }\n\n    return diff.calculate(from, to)\n})\n\n// Patches given `state` with a given `diff` creating a new state that is\n// returned back.\npatch.define(State, function patch(state, id, value) {\n    var diff = id\n    if (arguments.length === 3) {\n        diff = {}\n        diff[id] = value\n    }\n\n    var value = new State()\n    // Store `diff` is stored so that it can be retrieved without calculations.\n    value[delta] = diff\n    value[parent] = state[id]\n\n    return rebase(make(value), state, diff)\n})\n\n\nfunction state() {\n    /**\n    Creates an object representing a state snapshot.\n    **/\n    var value = new State()\n    value[id] = timestamp()\n    value[parent] = null\n    return make(value)\n}\nstate.type = State\nstate.delta = delta\n\nmodule.exports = state\n\n//@ sourceURL=/reflex/state.js"
));

require.define("/node_modules/diffpatcher/diff.js",Function(['require','module','exports','__dirname','__filename','process','global'],"/* vim:set ts=2 sw=2 sts=2 expandtab */\n/*jshint asi: true undef: true es5: true node: true browser: true devel: true\n         eqnull: true forin: true latedef: false globalstrict: true*/\n\n\"use strict\";\n\nvar method = require(\"method\")\n\n// Method is designed to work with data structures representing application\n// state. Calling it with a state should return object representing `delta`\n// that has being applied to a previous state to get to a current state.\n//\n// Example\n//\n// diff(state) // => { \"item-id-1\": { title: \"some title\" } \"item-id-2\": null }\nvar diff = method()\n\n// diff between `null` / `undefined` to any hash is a hash itself.\ndiff.define(null, function(from, to) { return to })\ndiff.define(undefined, function(from, to) { return to })\ndiff.define(Object, function(from, to) {\n  return calculate(from, to || {}) || {}\n})\n\nfunction calculate(from, to) {\n  var diff = {}\n  var changes = 0\n  Object.keys(from).forEach(function(key) {\n    changes = changes + 1\n    if (!(key in to) && from[key] != null) diff[key] = null\n    else changes = changes - 1\n  })\n  Object.keys(to).forEach(function(key) {\n    changes = changes + 1\n    var previous = from[key]\n    var current = to[key]\n    if (previous === current) return (changes = changes - 1)\n    if (typeof(current) !== \"object\") return diff[key] = current\n    if (typeof(previous) !== \"object\") return diff[key] = current\n    var delta = calculate(previous, current)\n    if (delta) diff[key] = delta\n    else changes = changes - 1\n  })\n  return changes ? diff : null\n}\n\ndiff.calculate = calculate\n\nmodule.exports = diff\n\n//@ sourceURL=/node_modules/diffpatcher/diff.js"
));

require.define("/node_modules/monotonic-timestamp/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {}\n//@ sourceURL=/node_modules/monotonic-timestamp/package.json"
));

require.define("/node_modules/monotonic-timestamp/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var _last = 0\nvar _count = 1\n\nmodule.exports = \nfunction () {\n  var t = Date.now()\n  var _t = t\n  if(_last == t) {\n    _t += ((_count++)/1000) \n  } \n  else _count = 1 \n\n  _last = t\n\n  return _t\n}\n\n\n//@ sourceURL=/node_modules/monotonic-timestamp/index.js"
));

require.define("/reflex/writer.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var reduce = require(\"reducers/reduce\")\n\nmodule.exports = Writer\n\nfunction Writer(update, open, close) {\n    return function write(changes, options) {\n        var readable = open(options)\n\n        reduce(changes, function (_, change) {\n            if (change === null) {\n                close(readable, options)\n            } else {\n                update(readable, change)\n            }\n        })\n\n        return readable\n    }\n}\n\n//@ sourceURL=/reflex/writer.js"
));

require.define("/todo/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = TodoList\n\nfunction TodoList(parent) {\n    return function react() {\n\n    }\n}\n\n//@ sourceURL=/todo/index.js"
));

require.define("/node_modules/browserify-server/other.js",Function(['require','module','exports','__dirname','__filename','process','global'],"process.env.NODE_ENV = 'undefined'\n\n//@ sourceURL=/node_modules/browserify-server/other.js"
));
require("/node_modules/browserify-server/other.js");

require.define("/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var prepend = require(\"insert\").prepend\n    , partial = require(\"ap\").partial\n    , channel = require(\"reducers/channel\")\n\n    , pipe = require(\"./lib/pipe\")\n    , persist = require(\"./persist\")\n    , TodoList = require(\"./todo\")\n\n    , body = document.body\n    /*\n        Your application is actually a stream of changes.\n    */\n    , app = channel()\n    /*\n        For anything to happen you need to build reactors\n            that react to changes and return a stream of\n            inputs that need to be merged back in\n    */\n    , reactors = [\n        TodoList(partial(prepend, body))\n        , persist\n    ]\n\nreactors.forEach(function (reactor) {\n    var input = reactor(app)\n    pipe(input, app)\n})\n\n// Expose require\nwindow.require = require\n\n//@ sourceURL=/index.js"
));
require("/index.js");
})();
