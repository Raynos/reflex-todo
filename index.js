var livereload = require("live-reload")(8081)
    // , store = require("local-store")("todo-stream")
    , forEach = require("chain-stream").forEach

    , State = require("./reflex/state")
    , initial = require("./initial")
    , TodoListWidget = require("./todos/list")
    , TodoOperations = require("./todos/operations")

/*
    State contains the central state of the application

    You create it and send it to everyone else

        - state.patch(changes) patches the current
            state with those changes
        - state itself is pipeable and contains a
            stream of the current state
        - state.changes is pipeable and contains a
            stream of only the changes
        - state.summaries is pipeable and contains a
            stream of change summaries

*/
var state = window.state = State()

// forEach(state, function (state) {
//     console.log("state", state)
// })

var todoList = TodoListWidget(state, document.body)
var operations = TodoOperations(state)

forEach(todoList, state.patch)

// Initial manipulations for debugging purposes
initial(state)
