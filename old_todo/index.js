var channel = require("reducers/channel")
    , buffer = require("reducers/buffer")
    , flatten = require("reducers/flatten")
    , insert = require("insert")
    , prepend = insert.prepend
    , append = insert.append

    , html = require("../lib/html")
    , forEach = require("../lib/forEach")
    , entity = require("../reflex/entity")
    , todoListHtml = require("./html/todoList")
    , writers = require("./writers")
    , readers = require("./readers")
    , entities = require("./entities")
    , fork = require("./forks")
    , operations = require("./operations")

module.exports = todoList

function todoList(state) {
    var component = html(todoListHtml)
        , forks = fork(state)
        , stream = flatten([
            children(forks, component)
            , operations(state)
        ])

    stream.view = component.root

    return stream
}

function children(forks, component) {
    var todosComponents = entities.todo(forks.todoChanges)
        , itemsLeft = writers.itemsLeft(forks.counters)
        , completedCount = entities.completedCount(forks.counters)
        , allCompleted = entities.allCompleted(forks.counters)
        , newTodos = readers.input(component)

    forEach(todosComponents.views, function (view) {
        append(component.list, view.root)
    })

    forEach(itemsLeft, function (view) {
        prepend(component.footer, view.root)
    })

    forEach(completedCount.views, function (view) {
        append(component.footer, view.root)
    })

    forEach(allCompleted.views, function (view) {
        prepend(component.main, view.root)
    })

    return flatten([newTodos, completedCount
        , allCompleted, todosComponents])
}
