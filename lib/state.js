var chain = require("chain-stream")
    , extend = require("xtend")
    , prop = require("prop")

    , Symbol = require("./symbol")

    , summary = Symbol()
    , summaryName = summary.toString()

State.summary = summary.toString()

State.toSummary = prop(summaryName)

module.exports = State

/*
    State takes a source of DataObjects

    A DataObject has two special properties

      - id. Every DataObject has a unique id field
      - __deleted__. This signals that the DataObject
        has been removed from the input

    To apply changes to a DataObject just add a new
        one to the source with the same id but
        different properties.

    It returns a stream containing the entire state
        for each value including a summary of the most
        recent change.
*/
function State(source) {
    return chain.reductions(source, accumulate, {})
}

function accumulate(hash, value) {
    var id = value.id
        , clone = extend({}, hash)
        , old = hash[id] || {}
        , changes = {}

    if (!old.id) {
        changes.type = "new"
    } else if (value.__deleted__ === true) {
        changes.type = "deleted"
        changes.oldValue = old
    } else {
        changes.type = "updated"
        changes.oldvalue = old
    }

    var newValue = extend({}, old, value)

    changes.name = id
    changes.value = newValue

    clone[id] = newValue

    summary(clone, changes)

    return clone
}
