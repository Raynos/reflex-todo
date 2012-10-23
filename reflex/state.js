var chain = require("chain-stream")
    , reductions = chain.reductions
    , map = chain.map
    , concatMap = chain.concatMap
    , extend = require("xtend")
    , forEach = require("for-each")
    , ReadStream = require("read-stream")
    , prop = require("prop")

    , changesName = "changes@" + module.id.replace(/\./g, "")
    , summaryName = "summaries@" + module.id.replace(/\./g, "")
    , toChanges = prop(changesName)
    , toSummaries = prop(summaryName)

State.toChanges = toChanges
State.toSummaries = toSummaries
State.operation = operation
State.isOperation = isOperation

module.exports = State

/*
    State generates a central place for your application state

    A state instance is a stream of the current state.

    ## patch

    `state.patch` allows you to patch the current state
        with a new change. A change looks like

        {
            valueId: newValue
        }

    If the valueId hasn't been seen before a "new" summary
        will be made and it will be merged into the current
        state

    If the newValue is `null` the valueId will be removed from
        the current state and a "deleted" summary will be made

    If the valueId already exists and the newValue is not `null`
        then the newValue will be shallow merged into the
        existing value and a "updated" summary will be made

    ## summary

    `State.summary` takes a state and returns the change summary
        for the state based on what's changed since the previous
        state.

    A summary is a record that looks like

        {
            type: "new" or "deleted" or "updated"
            , name: id
            , value: currentValue
            , oldValue: oldValue
        }

    ## changes

    `State.changes` takes a state and returns the actual changes
        that were applied on it since the previous state. i.e.
        the value of the last `patch` call.
*/
function State() {
    var state = ReadStream()
        , stream = state.stream
        , states = reductions(stream, accumulate, {})

    states.patch = patch

    return states

    function patch(changes, value) {
        if (arguments.length === 2) {
            var id = changes
            changes = {}
            changes[id] = value
        }

        state.push(changes)
    }
}

function accumulate(previousState, changes) {
    var currentState = extend({}, previousState)
        , summaries = []

    forEach(changes, function (change, id) {
        var oldValue = currentState[id] || {}
            , summary = {}
            , newValue = null

        if (change) {
            newValue = extend({}, oldValue, change)
        }

        if (!(id in currentState)) {
            summary.type = "new"
        } else if (change === null) {
            summary.type = "deleted"
            summary.oldValue = oldValue
        } else {
            summary.type = "updated"
            summary.oldValue = oldValue
        }

        summary.name = id
        summary.value = newValue

        currentState[id] = newValue

        summaries.push(summary)
    })

    nonEnumerable(currentState, changesName, changes)
    nonEnumerable(currentState, summaryName, summaries)

    return currentState
}

/*
    Func<name> -> Func -> OperationData

    Function that takes an operation name and returns an
        operation structure for that name
*/
function operation(name) {
    return function () {
        return {
            operation: {
                value: name
            }
        }
    }
}

/*
    Func<name> -> Func<state> -> Boolean
*/
function isOperation(name) {
    return function (state) {
        var operation = state[changesName].operation

        return operation && operation.value === name
    }
}

function nonEnumerable(obj, key, value) {
    Object.defineProperty(obj, key, {
        writable: true
        , value: value
        , enumerable: false
        , configurable: true
    })
}
