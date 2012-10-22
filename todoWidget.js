var append = require("insert").append
    , unpack = require("unpack-element")
    , Element = require("fragment").Element

    , ListWidget = require("./lib/widget").ListWidget
    , todoHtml = require("./todo.html")

    , TodoWidget = ListWidget(
        function TodoComponent(state, parent) {
            var component = unpack(Element(todoHtml))

            append(parent.list, component.root)

            return component
        }
        , function updateTodo(current, previous, component) {
            if ("title" in current) {
                component.text.textContent = current.title
                component.input.value = current.title
            }

            if ("completed" in current) {
                component.toggle.checked = current.completed
            }
        }
        , function destroyTodo(component, parent) {
            parent.list.removeChild(component.root)
        }
    )

module.exports = TodoWidget
