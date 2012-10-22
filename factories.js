var uuid = require("node-uuid")

module.exports = {
    newTodo: newTodo
}

function newTodo(title) {
    var id = "todo:" + uuid()
        , changes = {}

    changes[id] = {
        id: id
        , title: title
        , completed: false
    }

    return changes
}
