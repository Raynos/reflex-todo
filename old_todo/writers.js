var remove = require("insert").remove

    , html = require("../lib/html")
    , writer = require("../reflex/writer")
    , forEach = require("../lib/forEach")
    , itemsLeftHtml = require("./html/itemsLeft")

module.exports = {
    itemsLeft: writer(function swap(component, counter) {
            var text = component.countText
                , count = counter.remaining

            if (count === 1) {
                text.textContent = "item left"
            } else {
                text.textContent = "items left"
            }

            component.count.textContent = count
        }, function open(options, value) {
            return html(itemsLeftHtml)
        }, function close(component) {
            remove(component.root)
        })
}


