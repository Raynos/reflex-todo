var reduce = require("reducers/reduce")
var emit = require("reducers/emit")

module.exports = pipe

function pipe(input, output) {
    reduce(input, function(_, x) {
        emit(output, x)
    })
}
