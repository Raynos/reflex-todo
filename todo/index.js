var partial = require("ap").partial
    , insert = require("insert")
    , append = insert.append

    , TodoItem = require("./item")
    , Unit = require("../reflex/unit")
    , html = require("../lib/html")
    , todoListHtml = require("./html/todoList")

module.exports = TodoList

function TodoList(parent) {
    var component = html(todoListHtml)

    parent(component.root)

    return Unit({
        "todo": TodoItem(partial(append, component.list))
    })
}
