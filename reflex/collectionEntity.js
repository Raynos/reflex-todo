var reduce = require("reducers/reduce")
var emit = require("reducers/emit")
var channel = require("reducers/channel")
var pipe = require("../lib/pipe")

module.exports = collectionEntity

function collectionEntity(read, write) {
    return function make(input, options) {
        // write returns a channel of instances
        var instances = write(input, options)
        // expose channel of views to be able to reduce them
        // into a container
        var views = channel()
        var stream = channel()
        // for each instance emit the instance on the views
        // and pipe the read result into the stream
        reduce(instances, function (_, instance) {
            emit(views, instance)
            pipe(read(instance), stream)
        })
        stream.views = views
        return stream
    }
}
