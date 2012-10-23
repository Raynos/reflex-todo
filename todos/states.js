var chain = require("chain-stream")
    , reductions = chain.reductions
    , filter = chain.filter
    , map = chain.map
    , not = require("not")

    , State = require("../reflex/state")

module.exports = {
    counters: counters
    , todos: todos
    , isTodo: isTodo
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
    return chain(state)
        .concatMap(State.toSummaries)
        .filter(function (summary) {
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
