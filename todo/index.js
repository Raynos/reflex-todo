var partial = require("ap").partial
    , insert = require("insert")
    , append = insert.append

    , TodoItem = require("./item")
    , Unit = require("../reflex/unit")
    , html = require("../lib/html")
    , todoListHtml = require("./html/todoList")

module.exports = TodoList

/*
    TodoList takes a parent function to pass the view onto
        so the parent can handle the view.

    TodoList is a Unit composed of
        todo -> TodoItem.

    For each todoItem created it's appended to component.list
*/
function TodoList(parent) {
    var component = html(todoListHtml)

    parent(component.root)

    return Unit({
        "todo": TodoItem(partial(append, component.list))
    })
}
