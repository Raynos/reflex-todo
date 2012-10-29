var reduce = require("reducers/reduce")

module.exports = forEach

function forEach(reducible, callback) {
    return reduce(reducible, invoke, null)

    function invoke(acc, value) {
        return callback(value)
    }
}
