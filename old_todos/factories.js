var uuid = require("node-uuid")

/*
    Factories are needed because the patch api is ugly.

    It's also needed to remove the todo structure information
        from the actual interaction functions
*/
module.exports = {
    newTodo: newTodo
    , changeCompleted: changeCompleted
    , destructions: destructions
    , updates: updates
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

function changeCompleted(component) {
    return function (completed) {
        var changes = {}

        changes[component.id] = {
            completed: completed
        }

        return changes
    }
}

function destructions(component) {
    return function () {
        var changes = {}

        changes[component.id] = null

        return changes
    }
}

function updates(component) {
    return function (title) {
        var changes = {}

        changes[component.id] = {
            title: title
        }

        return changes
    }
}
