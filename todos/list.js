var unpack = require("unpack-element")
    , Element = require("fragment").Element
    , chain = require("chain-stream")
    , forEach = chain.forEach
    , events = require("events-stream")
    , prepend = require("insert").prepend

    , Widget = require("../reflex/widget")
    , Writer = require("../reflex/writer")
    , TodoWidget = require("./todo")
    , todoListHtml = require("./todoList.html")
    , equal = require("../lib/equal")
    , method = require("../lib/method")
    , states = require("./states")
    , todos = states.todos
    , counters = states.counters
    , factories = require("./factories")
    , newTodo = factories.newTodo
    , operation = require("../reflex/state").operation

    , ENTER = 13
    , TodoListWidget = Widget(
        function TodoListComponent(state, parent) {
            var component = unpack(Element(todoListHtml))

            prepend(parent, component.root)

            return component
        }
        , [function renderTodos(state, component) {
            return TodoWidget(state, todos(state), component)
        }
        , Writer(counters, function (counter, component) {
            var text = component.countText
                , count = counter.remaining

            if (count === 1) {
                text.textContent = "item left"
            } else {
                text.textContent = "items left"
            }

            component.count.textContent = count
        })
        , Writer(counters, function (counter, component) {
            component.completedCount.textContent =
                counter.completed
        })
        , Writer(counters, function (counter, component) {
            var all = component.all
                , remaining = counter.remaining
                , completed = counter.completed

            if (remaining === 0 && completed > 0) {
                all.checked = true
            } else {
                all.checked = false
            }
        })
        , function input(state, component) {
            var inputEvents = events(component.input, "keypress")

            return chain(inputEvents)
                .filter(equal("keyCode", ENTER))
                .map(function getFieldValue(event) {
                    var input = event.target
                        , value = input.value

                    input.value = ""

                    return value
                })
                .filter(toBoolean)
                .map(method("trim"))
                .map(newTodo)
        }
        , function toggles(state, component) {
            var toggleEvents = events(component.all, "click")

            return chain(toggleEvents)
                .map(operation("allCompleted"))
        }
        , function clears(state, component) {
            var clearEvents = events(component.clear, "click")

            return chain(clearEvents)
                .map(operation("clearCompleted"))
        }
    ])

module.exports = TodoListWidget

function toBoolean(value) {
    return !!value
}
