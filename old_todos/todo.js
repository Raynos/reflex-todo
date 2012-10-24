var append = require("insert").append
    , unpack = require("unpack-element")
    , Element = require("fragment").Element
    , chain = require("chain-stream")
    , map = chain.map
    , forEach = chain.forEach
    , events = require("events-stream")
    , prop = require("prop")
    , ClassList = require("class-list")

    , ListWidget = require("../reflex/listWidget")
    , todoHtml = require("./todo.html")
    , factories = require("./factories")
    , destructions = factories.destructions
    , changeCompleted = factories.changeCompleted
    , updates = factories.updates
    , equal = require("../lib/equal")
    , method = require("../lib/method")

    , ENTER = 13
    , TodoWidget = ListWidget(
        function TodoComponent(state, parent, summary) {
            var component = unpack(Element(todoHtml))
                , root = component.root
                , input = component.input

            component.id = summary.name

            append(parent.list, root)

            forEach(events(component.text, "dblclick")
                , function (event) {
                    ClassList(root).add("editing")
                    input.focus()
                })

            return component
        }
        , function updateTodo(current, previous, component) {
            if ("title" in current) {
                component.text.textContent = current.title
                component.input.value = current.title
            }

            if ("completed" in current) {
                var completed = current.completed

                component.toggle.checked = current.completed

                if (completed) {
                    ClassList(component.root).add("completed")
                } else {
                    ClassList(component.root).remove("completed")
                }
            }
        }
        , function destroyTodo(component, parent) {
            console.log("destroy", arguments)
            parent.list.removeChild(component.root)
        }
        , [function toggles(state, component) {
            var changesEvents = events(component.toggle, "change")

            return chain(changesEvents)
                .map(prop("target.checked"))
                .map(changeCompleted(component))
        }
        , function destroys(state, component) {
            var destroyEvents = events(component.destroy, "click")

            return map(destroyEvents
                , destructions(component))
        }
        , function saves(state, component) {
            var input = component.input
                , blurEvents = events(input, "blur")
                , keyEvents = events(input, "keypress")

            chain(keyEvents)
                .filter(equal("keyCode", ENTER))
                .forEach(function (event) {
                    event.target.blur()
                })

            var values = chain(blurEvents)
                .map(prop("target.value"))
                .map(method("trim"))
                .map(function (value) {
                    ClassList(component.root).remove("editing")

                    return value
                })

            var deletions = values
                .remove(toBoolean)
                .map(destructions(component))

            var changes = values
                .filter(toBoolean)
                .map(updates(component))

            return deletions.concat(changes)
        }]
    )

module.exports = TodoWidget

function toBoolean(value) {
    return !!value
}
