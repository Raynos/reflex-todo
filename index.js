var prepend = require("insert").prepend
    , partial = require("ap").partial
    , channel = require("reducers/channel")

    , pipe = require("./lib/pipe")
    , persist = require("./persist")
    , TodoList = require("./todo")
    , initial = require("./initial")

    , body = document.body
    /*
        Your application needs a single stream of changes
            for which all changes flow too
    */
    , changes = channel()
    /*
        The root part of the application is the TodoList.

        Pass it a function which tells you where to put the
            DOM element for the todoList.

        In this case prepend(body, elem)
    */
    , todoList = TodoList(partial(prepend, body))
    /*
        We want to have the changes flow through the persistance
            mechanism and the todoList
    */
    , app = [todoList, persist]

/*
    For each one create the input stream by passing in the
        changes stream and then pipe that back into the
        changes stream to create a closed loop flow.
*/
app.forEach(function (reactor) {
    pipe(reactor(changes), changes)
})

/*
    Inject some initial input into the changes stream for
        testing purpose
*/
initial(changes)

// Expose require
window.require = require
