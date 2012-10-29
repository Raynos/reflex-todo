var dotty = require("dotty")

module.exports = equal

function equal(prop, value) {
    return function (item) {
        if (typeof prop === "string" || Array.isArray(prop)) {
            return dotty.get(item, prop) === value
        } else {
            return item === value
        }
    }
}
