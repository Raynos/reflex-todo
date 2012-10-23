var forEach = require("chain-stream").forEach

module.exports = Writer

function Writer(fork, render) {
    return function (input, component) {
        forEach(fork(input), function (value) {
            render(value, component)
        })
    }
}
