var prepend = require("insert").prepend
    , partial = require("ap").partial
    , channel = require("reducers/channel")

    , pipe = require("./lib/pipe")
    , persist = require("./persist")
    , TodoList = require("./todo")

    , body = document.body
    /*
        Your application is actually a stream of changes.
    */
    , app = channel()
    /*
        For anything to happen you need to build reactors
            that react to changes and return a stream of
            inputs that need to be merged back in
    */
    , reactors = [
        TodoList(partial(prepend, body))
        , persist
    ]

reactors.forEach(function (reactor) {
    var input = reactor(app)
    pipe(input, app)
})

// Expose require
window.require = require
