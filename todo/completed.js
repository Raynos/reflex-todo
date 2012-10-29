var Writer = require("../reflex/writer")
    , html = require("../lib/html")
    , completedCountHtml = require("./html/completedCount")

module.exports = Completed

function Completed(parent) {
    return function reactor(changes) {
        Writer(swap, open)(changes)
    }

    function open() {
        var component = html(completedCountHtml)

        parent(component.root)

        return component
    }
}

function swap(component, counter) {
    component.completedCount.textContent = counter
}
