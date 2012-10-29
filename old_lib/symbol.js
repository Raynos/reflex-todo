var uuid = require("node-uuid")

module.exports = Symbol

function Symbol() {
    var name = uuid()

    symbol.toString = $toString

    return symbol

    function symbol(target, value) {
        if (arguments.length === 0) {
            return target[name]
        }

        Object.defineProperty(target, name, {
            value: value
            , configurable: true
            , writable: true
            , enumerable: false
        })
    }

    function $toString() {
        return name
    }
}
