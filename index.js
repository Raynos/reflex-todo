var ReadWriteStream = require("read-write-stream")
    , livereload = require("live-reload")(8081)
    , insert = require("insert")
    , chain = require("chain-stream")

    , State = require("./lib/state")
    , TodoListComponent = require("./todoList.js")

    , source = window.source = ReadWriteStream().stream
    , summaries = chain.map(State(source), State.toSummary)
    , todoList = TodoListComponent(summaries)

todoList.stream.pipe(source)

insert.prepend(document.body, todoList.root)

/* TODO:

    - persistance
    - routing
    X new todo
    X mark all as complete
    X Item
      X clicking done
      X edit mode
      X destroy
    X Editing
    X Counter
    X Clear completed

*/

// Initial interactions
source.write({
    id: 1
    , completed: false
    , title: "foo"
})

setTimeout(function () {
    source.write({
        id: 1
        , completed: true
        , title: "bar"
    })
}, 1000)

setTimeout(function () {
    source.write({
        id: 1
        , __deleted__: true
    })
}, 2000)

