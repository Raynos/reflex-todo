var reduce = require("reducers/reduce")
var filter = require("reducers/filter")
var map = require("reducers/map")
var channel = require("reducers/channel")
var flatten = require("reducers/flatten")
var emit = require("reducers/emit")
var concat = require("reducers/concat")

module.exports = Component

function Component(read, write) {
    return function reactor(changes, options) {
        var inputs = channel()
        var hash = {}

        reduce(changes, function (_, change) {
            Object.keys(change).forEach(function (id) {
                if (id in hash) {
                    if (change[id] === null) {
                        delete hash[id]
                    }

                    return
                }

                hash[id] = true

                var items = concat(change, changes)
                var fork =  filter(items, exists)
                var updates = map(fork, attribute)
                var readable = write(updates, options)
                var input = read(readable)
                var deltas = map(input, expand)

                emit(inputs, deltas)

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

        return flatten(inputs)
    }
}
