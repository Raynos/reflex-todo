var chain = require("chain-stream")
    , reductions = chain.reductions
    , filter = chain.filter
    , map = chain.map
    , not = require("not")

    , State = require("../reflex/state")

/*
    States are a set of forking functions that can be called
        on the entire application state to give a view into
        a subset of the state.

    This is used to move the forking logic out of the widgets
        and allow re-usal of the forks
*/
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
