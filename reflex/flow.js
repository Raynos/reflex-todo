var state = require("./state")
var patch = require("diffpatcher/patch")
var channel = require("reducers/channel")
var reductions = require("reducers/reductions")

module.exports = flow

function flow(initial) {
    var stream = channel()
    var states = reductions(stream, function (state, delta) {
        return patch(state, delta)
    }, state(initial))

    return {
        output: states
        , input: stream
    }
}
