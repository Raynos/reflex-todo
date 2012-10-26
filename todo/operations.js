var filter = require("reducers/filter")
    , map = require("reducers/map")
    , expand = require("reducers/expand")
    , not = require("not")
    , flatten = require("reducers/flatten")

    , delta = require("../reflex/state").delta
    , equal = require("../lib/equal")
    , forEach = require("../lib/forEach")
    , todos = require("./forks").todos
    , factory = require("../reflex/factory")
    , attribute = require("../lib/attribute")

module.exports = operations

function operations(state) {
    var clears = filter(state.output
        , equal([delta, "operation", "value"], "clearCompleted"))

    forEach(clears, function (v) {
        console.log("clear", v)
    })

    var removals = expand(clears, function (current) {
        console.log("current clear", todos(current))

        return todos(current)
            .filter(attribute("completed"))
            .map(factory(null))
    })

    var allCompleted = filter(state.output
        , equal([delta, "operation", "value"], "allCompleted"))


    forEach(allCompleted, function (v) {
        console.log("all completed", v)
    })

    var updates = expand(allCompleted, function (current) {
        var items = todos(current)

        console.log("current all", items, current)

        if (items.every(attribute("completed"))) {
            return items.map(factory({
                completed: false
            }))
        }

        return items
            .filter(not(attribute("completed")))
            .map(factory({ completed: true }))
    })

    return flatten([ updates, removals ])
}
