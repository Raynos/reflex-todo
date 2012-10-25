var reduce = require("reducers/reduce")
    , channel = require("reducers/channel")
    , reductions = require("reducers/reductions")
    , buffer = require("reducers/buffer")
    , filter = require("reducers/filter")
    , map = require("reducers/map")
    , unpack = require("unpack-element")
    , Element = require("fragment").Element
    , ClassList = require("class-list")
    , remove = require("insert").remove

    , writer = require("../reflex/writer")
    , summaries = require("../reflex/summaries")
    , collectionEntity = require("../reflex/collectionEntity")
    , entity = require("../reflex/entity")
    , state = require("../reflex/state")
    , todoListHtml = require("./todoList.html")
    , todoHtml = require("./todo.html")

module.exports = todoList

function todoList(app) {
    var component = unpack(Element(todoListHtml))
        , stream = buffer(channel())
        , changes = summaries(app)

    stream.view = component.root

    var todos = filter(changes, function (change) {
        console.log("change", change)
        return change.name.substr(0, 5) === "todo:"
    })

    var todoWriter = writer(
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
        }, function open(value, options) {
            return unpack(Element(todoHtml))
        }, function close(component) {
            remove(component.root)
        })

    var todosComponents = todoWriter(todos)

    reduce(todosComponents, function (_, todo) {
        component.list.appendChild(todo.root)
    })

    return stream
}

function attribute(name) {
    return function (item) {
        return item[name]
    }
}
