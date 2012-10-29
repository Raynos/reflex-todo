var ClassList = require("class-list")
    , remove = require("insert").remove

    , Writer = require("../reflex/writer")
    , Component = require("../reflex/component")
    , html = require("../lib/html")
    , todoHtml = require("./html/todo")

module.exports = TodoItem

/*
    TodoItem is a Component of a write / read part.

    The write part has swap, open and close.
        when a new todo item is found we open a DOM element for it.
        When a todo item is updated we swap the contents
        When a todo item is removed we close the DOM element

    When a new todo item is created (open is called on the writer)
        we pass the component upto the parent to have it injected
        into the DOM for us.
*/
function TodoItem(parent) {
    var write = Writer(swap, open, close)

    return Component(read, write)

    function open() {
        var component = html(todoHtml)

        parent(component.root)

        return component
    }
}

function swap(component, value) {
    if ("title" in value) {
        component.text.textContent = value.title
        component.input.value = value.title
    }

    if ("completed" in value) {
        var completed = value.completed

        component.toggle.checked = value.completed

        if (completed) {
            ClassList(component.root).add("completed")
        } else {
            ClassList(component.root).remove("completed")
        }
    }
}

function close(component) {
    remove(component.root)
}

function read() {

}
