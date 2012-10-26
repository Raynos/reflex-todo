var emit = require("reducers/emit")
    , store = require("local-store")("reflex-todo")
    , extend = require("xtend")

    , forEach = require("./lib/forEach")
    , initial = require("./initial")

module.exports = persist

function persist(state) {
    forEach(state.output, saveState)

    var initialState = store.get("state")

    if (initialState) {
        emit(state.input, initialState)
    }

    // Initial manipulations for debugging purposes
    initial(state.input)
}

function saveState(current) {
    var clone = extend({}, current)

    ;delete clone.operation
    // console.log("current", current)
    store.set("state", clone)
}
