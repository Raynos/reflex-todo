var remove = require("insert").remove

    , html = require("../lib/html")
    , Writer = require("../reflex/writer")
    , itemsLeftHtml = require("./html/itemsLeft")

module.exports = Remaining

function Remaining(parent) {
    return function reactor(changes) {
        Writer(swap, open, close)(changes)
    }

    function open(options, value) {
        var component = html(itemsLeftHtml)

        parent(component.root)

        return component
    }
}

function swap(component, count) {
    var text = component.countText

    if (count === 1) {
        text.textContent = "item left"
    } else {
        text.textContent = "items left"
    }

    component.count.textContent = count
}

function close(component) {
    remove(component.root)
}
