var filter = require("reducers/filter")
var map = require("reducers/map")
var flatten = require("reducers/flatten")

module.exports = Unit

function Unit(mapping) {
    return function reactor(changes, options) {
        var inputs = Object.keys(mapping).map(function (id) {
            var react = mapping[id]
            var fork = filter(changes, exists)
            var updates = map(fork, attribute)

            var input = react(updates, options)

            return map(input, expand)

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

        return flatten(inputs)
    }
}
