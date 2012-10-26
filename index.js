var livereload = require("live-reload")(8081)
    , prepend = require("insert").prepend

    , flow = require("./reflex/flow")
    , pipe = require("./lib/pipe")
    , forEach = require("./lib/forEach")
    , persist = require("./persist")
    , TodoList = require("./todo")

    , body = document.body
    , state = window.state = flow({ summary: "initial" })
    , todoList = TodoList(state)

pipe(todoList, state.input)

prepend(document.body, todoList.view)

persist(state)

window.require = require
