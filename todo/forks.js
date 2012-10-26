var filter = require("reducers/filter")
    , reductions = require("reducers/reductions")
    , not = require("not")

    , summaries = require("../reflex/summaries")

fork.todos = todos

module.exports = fork

function fork(state) {
    var output = state.output
        , changes = summaries(output)
        , todoChanges = filter(changes, function (change) {
            return isTodo(change.name)
        })
        , counters = reductions(output, intoCounters, {})

    return {
        todoChanges: todoChanges
        , counters: counters
    }
}

function todos(current) {
    return Object.keys(current)
        .filter(isTodo)
        .map(function (name) {
            return current[name]
        })
        .filter(Boolean)
}

function isTodo(str) {
    return str.substr(0, 5) === "todo:"
}

function intoCounters(_, current) {
    var values = Object.keys(current)
        .filter(isTodo)
        .map(function (key) {
            return current[key]
        })
        .filter(toBoolean)

    return {
        completed: values.filter(isCompleted).length
        , remaining: values.filter(not(isCompleted)).length
    }
}

function toBoolean(value) {
    return !!value
}

function isCompleted(item) {
    return item && item.completed
}
