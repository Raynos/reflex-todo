var state = require("./state")
var patch = require("diffpatcher/patch")
var channel = require("reducers/channel")
var reductions = require("reducers/reductions")

module.exports = flow

function flow(initial) {
    var stream = channel()
    var orig = state(initial)
    var states = reductions(stream, patch, orig)

    return {
        output: states
        , input: stream
        , initial: orig
    }
}
