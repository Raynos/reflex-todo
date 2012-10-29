var compound = require("compound")
    , partial = require("ap").partial
    , insert = require("insert")
    , append = insert.append
    , prepend = insert.prepend
    , map = require("reducers/map")
    , filter = require("reducers/filter")
    , flatten = require("reducers/flatten")
    , events = require("dom-reduce/event")
    , compound = require("compound")
    , uuid = require("node-uuid")

    , TodoItem = require("./item")
    , Unit = require("../reflex/unit")
    , html = require("../lib/html")
    , equal = require("../lib/equal")
    , method = require("../lib/method")
    , todoListHtml = require("./html/todoList")
    , computed = require("./computed")
    , CompletedCount = require("./completed")
    , RemainingCount = require("./remaining")
    , AllCompleted = require("./allCompleted")

    , ENTER = 13

module.exports = TodoList

/*
    TodoList takes a parent function to pass the view onto
        so the parent can handle the view.

    TodoList is a Unit composed of
        todo -> TodoItem.

    For each todoItem created it's appended to component.list
*/
function TodoList(parent) {
    return function reactor(changes) {
        var component = html(todoListHtml)
            , unit = Unit({
                "todo": TodoItem(partial(append, component.list))
                , "count": [
                    Unit({
                        // completed: CompletedCount(partial(
                        //     append, component.footer))
                        remaining: RemainingCount(partial(
                            prepend, component.footer))
                    })
                    // , AllCompleted(partial(prepend, component.main))
                ]
            })

        changes = computed(changes)

        // require("reducers/reduce")(changes, function (_, v) {
        //     console.log("value", v)
        // })

        parent(component.root)

        return flatten([unit(changes), read(component)])
    }
}

function read(component) {
    return compound
        (filter, function (ev) {
            return equal("keyCode", ENTER)(ev)
        })
        (map, getFieldValue)
        (filter, Boolean)
        (map, method("trim"))
        (map, function (title) {
            var changes = {}

            changes[uuid()] = {
                title: title
                , complted: false
            }

            return {
                todo: changes
            }
        })
        (events(component.input, "keypress"))
}

function getFieldValue(event) {
    var input = event.target
        , value = input.value

    input.value = ""

    return value
}
