var channel = require("reducers/channel")
var buffer = require("reducers/buffer")
var emit = require("reducers/emit")
var forEach = require("../lib/forEach")
var pipe = require("../lib/pipe")

module.exports = widget

/*
    Reactor takes a reading function and an writing function
        (created from writer).

    It returns a function that looks like a writing function
*/
function widget(read, write) {
    return function make(input, options) {
        // Create / hook an instance using options passed
        var instances = write(input, options)
        var stream = buffer(channel())

        forEach(instances, function(instance) {
            pipe(read(instance), stream)
        })

        return stream
    }
}
