var chain = require("chain-stream")
    , ReadStream = require("read-stream")
    , concat = chain.concat
    , forEach = chain.forEach
    , toArray = require("to-array")

Widget.ListWidget = ListWidget

module.exports = Widget

function Widget(component) {
    var children = toArray(arguments, 1)

    return function (input, parent) {
        var c = component(input, parent)

        return concat.apply(null, children.map(function (f) {
            return f(input, c)
        }).filter(function (stream) {
            return !!stream
        }))
    }
}

function ListWidget(component, update, destroy) {
    var children = toArray(arguments, 3)
        , hash = {}

    return function (input, list, parent) {
        var queue = ReadStream()

        forEach(list, function (summary) {
            var type = summary.type
                , id = summary.name
                , value = summary.value
                , oldValue = summary.oldValue || null
                , c = hash[id]

            if (type === "new") {
                c = hash[id] = component(input, parent)
                update(value, oldValue, c)
                children.map(function (f) {
                    f(input, c)
                }).filter(function (stream) {
                    return !!stream
                }).forEach(function (stream) {
                    forEach(stream, queue.push)
                })
            } else if (type === "updated") {
                update(value, oldValue, c)
            } else if (type === "deleted") {
                destroy(c, parent)
            }
        })

        return queue.stream
    }
}
