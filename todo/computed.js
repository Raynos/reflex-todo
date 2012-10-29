var prop = require("prop")

    , Overlay = require("../reflex/overlay")

module.exports = Overlay({
    count: function (previous, current) {
        var todos = current.todo || {}
            , ids = Object.keys(todos)
            , count = ids.length
            , completed = ids
                .map(function (id) { return todos[id] })
                .filter(prop("completed"))
                .length
            , count = {
                completed: completed
                , remaining: count - completed
            }

        return count
    }
})
