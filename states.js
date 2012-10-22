var chain = require("chain-stream")
    , reductions = chain.reductions
    , filter = chain.filter
    , not = require("not")

module.exports = {
    counters: counters
    , todos: todos
}

function counters(state) {
    return reductions(state, intoCounters, {})

    function intoCounters(_, current) {
        var values = Object.keys(current).filter(isTodo)
            .map(function (key) {
                return current[key]
            })
            .filter(toBoolean)

        return {
            completed: values.filter(isCompleted).length
            , remaining: values.filter(not(isCompleted)).length
        }
    }
}

function todos(state) {
    return filter(state.summaries, function (summary) {
        return isTodo(summary.name)
    })
}

function toBoolean(value) {
    return !!value
}

function isTodo(key) {
    return key.substr(0, 4) === "todo"
}

function isCompleted(item) {
    return item && item.completed
}
