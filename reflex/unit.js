var filter = require("reducers/filter")
var map = require("reducers/map")
var flatten = require("reducers/flatten")
var channel = require("reducers/channel")
var reduce = require("reducers/reduce")
var emit = require("reducers/emit")

module.exports = Unit

function Unit(mapping) {
    return function reactor(source, options) {
        var changes = source || channel()

        var inputs = Object.keys(mapping).map(function (id) {
            var reacts = mapping[id]
            var fork = filter(changes, exists)
            var updates = map(fork, attribute)

            var inputs = map(reacts, function (react) {
                var input = react(updates, options)
                return map(input, expand)
            })

            return flatten(inputs)

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

        var input = flatten(inputs)

        if (!source) {
            pipe(input, changes)
        }

        return source ? input : changes
    }
}

function pipe(input, output) {
    reduce(input, function(_, x) {
        emit(output, x)
    })
}
