var reduce = require("reducers/reduce")
var filter = require("reducers/filter")
var map = require("reducers/map")
var channel = require("reducers/channel")
var flatten = require("reducers/flatten")
var emit = require("reducers/emit")

module.exports = Component

function Component(read, write) {
    return function reactor(changes, options) {
        var input = channel()
        var hash = {}

        reduce(changes, function (_, change) {
            Object.keys(change).forEach(function (id) {
                if (change[id] === null) {
                    delete hash[id]
                }

                if (id in hash) {
                    return
                }

                hash[id] = true

                var fork = filter(changes, exists)
                var updates = map(fork, attribute)
                var readable = write(updates, options)
                var input = read(readable)
                var deltas = map(input, expand)

                emit(input, deltas)

                function exists(data) {
                    return id in data
                }

                function attribute(data) {
                    return data[id]
                }

                function expand(change) {
                    var changes = {}
                    changes[id] = change
                    return changes
                }
            })
        })

        return flatten(input)
    }
}
