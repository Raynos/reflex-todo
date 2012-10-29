var remove = require("insert").remove

    , html = require("../lib/html")
    , Writer = require("../reflex/writer")
    , itemsLeftHtml = require("./html/itemsLeft")

module.exports = Remaining

function Remaining(parent) {
    var writer = Writer(swap, open, close)

    return call

    function call(stream) {
        writer(stream)
    }

    function open(options, value) {
        console.log("open", arguments)
        var component = html(itemsLeftHtml)

        parent(component.root)

        return component
    }
}

function swap(component, count) {
    console.log("swap", count)
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
