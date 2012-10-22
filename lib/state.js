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

module.exports = State

/*

*/
function State() {
    var state = ReadStream()
        , stream = state.stream
        , states = reductions(stream, accumulate, {})

    states.patch = patch
    states.changes = map(states, toChanges)
    states.summaries = concatMap(states, toSummaries)

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

function nonEnumerable(obj, key, value) {
    Object.defineProperty(obj, key, {
        writable: true
        , value: value
        , enumerable: false
        , configurable: true
    })
}
