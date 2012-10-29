var Store = require("local-store")
    , reductions = require("reducers/reductions")
    , patch = require("diffpatcher/patch")
    , compound = require("compound")

    , state = require("./reflex/state")
    , Writer = require("./reflex/writer")

/*
    The persistance is a composition of a

        - fork (fork the changes into states)
        - writer. Open the store & write to it for each new
            state
        - reader. Return the initial state
*/
module.exports = (compound)
    (states)
    (Writer(swap, open))
    (read)

function read(store) {
    return store.get("state")
}

function swap(store, current) {
    delete current.operation
    // console.log("persisting", current)
    store.set("state", current)
}

function open() {
    return Store("reflex-todo")
}

function states(changes) {
    return reductions(changes, patch, state())
}
