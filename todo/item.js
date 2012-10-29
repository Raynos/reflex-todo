var ClassList = require("class-list")
    , remove = require("insert").remove
    , reduce = require("reducers/reduce")
    , map = require("reducers/map")
    , flatten = require("reducers/flatten")
    , filter = require("reducers/filter")
    , events = require("dom-reduce/event")
    , compound = require("compound")
    , prop = require("prop")
    , not = require("not")

    , Writer = require("../reflex/writer")
    , Component = require("../reflex/component")
    , html = require("../lib/html")
    , method = require("../lib/method")
    , equal = require("../lib/equal")
    , todoHtml = require("./html/todo")

    , ENTER = 13

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

function read(component) {
    var root = component.root
        , input = component.input

    compound
        (reduce, function () {
            ClassList(root).add("editing")
            input.focus()
        })
        (events(component.text, "dblclick"))

    var completions = compound
        (map, prop("target.checked"))
        (map, function (completed) {
            return {
                completed: completed
            }
        })
        (events(component.toggle, "change"))

    var destructions = compound
        (map, nil)
        (events(component.destroy, "click"))

    compound
        (filter, equal("keyCode", ENTER))
        (reduce, function (_, event) {
            event.target.blur()
        })
        (events(input, "keypress"))

    var values = compound
        (map, prop("target.value"))
        (map, method("trim"))
        (events(input, "blur"))

    reduce(values, function(_, value) {
        ClassList(root).remove("editing")
    })

    var deletions = compound
        (filter, not(Boolean))
        (map, nil)
        (values)

    var changes = compound
        (filter, Boolean)
        (map, function (text) {
            return {
                title: text
            }
        })
        (values)

    return flatten([ destructions, completions
        , changes, deletions ])
}

function nil() {
    return null
}
