var html = require("../lib/html")
    , Writer = require("../reflex/writer")
    , allCompletedHtml = require("./html/allCompleted")

module.exports = AllCompleted

function AllCompleted(parent) {
    return function reactor(changes) {
        Writer(swap, open)(changes)
    }

    function open() {
        var component = html(allCompletedHtml)

        parent(component.root)

        return component
    }
}

function swap(component, counter) {
    var all = component.all
        , remaining = counter.remaining
        , completed = counter.completed

    if (remaining === 0 && completed > 0) {
        all.checked = true
    } else {
        all.checked = false
    }
}
