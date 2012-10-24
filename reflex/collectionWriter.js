var reduce = require("reducers/reduce")
var diff = require("diffpatcher/diff")
var channel = require("reducers/channel")
var emit = require("reducers/emit")

module.exports = collectionWriter

function collectionWriter(swap, open, close) {
    // Internal hash to store items in collection
    var hash = {}

    return function write(input, options) {
        // write returns a stream of components returned by
        // open.
        var stream = channel()

        // For each input
        reduce(input, function (_, delta) {
            // get the delta
            console.log("got value", delta)

            Object.keys(delta).forEach(function (id) {
                var value = delta[id]

                console.log("value?", value)

                // if we have it then swap it
                if (value === null) {
                    // close the component
                    close(hash[id], options)
                    ;delete hash[id]
                } else if (id in hash) {
                    var res = swap(hash[id], value)
                    // Only overwrite hash if we returned a
                    // result
                    if (res) {
                        hash[id] = res
                    }
                } else {
                    // Open the component
                    var output = hash[id] = open(value, options)
                    // Swap the empty initial state for the
                    // value state
                    var res = swap(output, value)
                    if (res) {
                        hash[id] = res
                    }
                    // emit the output on the returned stream
                    emit(stream, output)
                }
            })
        })

        return stream
    }
}
