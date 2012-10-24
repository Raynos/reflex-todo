var livereload = require("live-reload")(8081)
    , store = require("local-store")("reflex-todo")
    , emit = require("reducers/emit")
    , prepend = require("insert").prepend

    , flow = require("./reflex/flow")
    , forEach = require("./lib/forEach")
    , pipe = require("./lib/pipe")

    , initial = require("./initial")
    , TodoListWidget = require("./todo/list")
    // , TodoOperations = require("./todos/operations")

    , body = document.body

var state = window.state = flow({ summary: "initial" })

var todoList = TodoListWidget(state)
// var operations = TodoOperations(state)

pipe(todoList, state.input)

prepend(document.body, todoList.view)

forEach(state.output, saveState)

var initialState = store.get("state")

if (initialState) {
    emit(state.input, initialState)
}

// Initial manipulations for debugging purposes
initial(state.input)

function saveState(current) {
    console.log("current", current)
    store.set("state", current)
}
