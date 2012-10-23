var chain = require("chain-stream")
    , filter = chain.filter
    , forEach = chain.forEach
    , iterators = require("iterators")
    , prop = require("prop")
    , not = require("not")

    , isOperation = require("../reflex/state").isOperation
    , isTodo = require("./states").isTodo

module.exports = operations

function operations(state) {
    var clears = filter(state, isOperation("clearCompleted"))

    forEach(clears, function (current) {
        todos(current)
            .filter(prop("completed"))
            .forEach(function (_, id) {
                state.patch(id, null)
            })
    })

    var allCompleteds = filter(state, isOperation("allCompleted"))

    forEach(allCompleteds, function (current) {
        var items = todos(current)

        if (items.every(prop("completed"))) {
            return items.forEach(function (_, id) {
                state.patch(id, {
                    completed: false
                })
            })
        }

        items
            .filter(not(prop("completed")))
            .forEach(function(_, id) {
                state.patch(id, {
                    completed: true
                })
            })
    })
}

function todos(current) {
    return iterators(current)
        .filter(function (value, name) {
            return isTodo(name)
        })
        .filter(toBoolean)
}

function toBoolean(value) {
    return !!value
}