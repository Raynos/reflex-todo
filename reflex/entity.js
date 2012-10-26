var channel = require("reducers/channel")
var buffer = require("reducers/buffer")
var emit = require("reducers/emit")
var forEach = require("../lib/forEach")
var pipe = require("../lib/pipe")

module.exports = entity

function entity(read, write) {
    return function make(input, options) {
        // Create / hook an instance using options passed
        var instances = write(input, options)
        var stream = buffer(channel())

        forEach(instances, function(instance) {
            pipe(read(instance), stream)
        })

        stream.views = instances
        return stream
    }
}
