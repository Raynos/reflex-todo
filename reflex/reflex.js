var channel = require("reducers/channel")
var reduce = require("reducers/reduce")
var emit = require("reducers/emit")

module.exports = reflex

/*
    Given a reactor function and a forking function

    It will create a stream of changes.

    If needed it will fork the changes and then for each
        reactor it will call it with the changes and pipe
        the returned input back into the changes

    Usage:

        reflex(Unit({ ... }))

        reflex([reactor, reactor, ...])
*/
function reflex(reactors) {
    var changes = channel()

    reduce(reactors, function (_, reactor) {
        pipe(reactor(changes), changes)
    })

    return changes
}

function pipe(input, output) {
    reduce(input, function(_, x) {
        emit(output, x)
    })
}
