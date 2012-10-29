var reduce = require("reducers/reduce")

module.exports = Writer

function Writer(update, open, close) {
    return function write(changes, options) {
        var readable = open(options)

        reduce(changes, function (_, change) {
            if (change === null) {
                close(readable, options)
            } else {
                update(readable, change)
            }
        })

        return readable
    }
}
