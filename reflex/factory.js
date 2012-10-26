var uuid = require("node-uuid")
    , extend = require("xtend")

module.exports = factory

/*
    factory(component, function (completed) {
        return { completed: completed }
    }) -> {
        id: {
            id: #component.id
            , completed: completed
        }
    }

    factory(function (value) {
        return { value: value }
    }) -> {
        id: {
            id: :uuid()
            , value: value
        }
    }

    factory(prefix, function (value) {
        return { value: value }
    }) -> {
        id: {
            id: prefix:uuid()
            , value: value
        }
    }

    factory(prefix, { completed: true })
        -> {
            id: {
                id: prefix:uuid()
                , value: value
            }
        }

    factory(function (component) {
        return component.id
    }) -> {
            id: null
        }

    factory({ completed: false })
        -> {
            [first argument].id: {
                completed: false
            }
        }
*/
function factory(component, creator) {
    var prefix = ""
        , orig

    if (typeof component === "string") {
        prefix = component
        component = null
    } else if (arguments.length === 1) {
        creator = component
        component = null
    }

    if (typeof creator !== "function") {
        orig = creator
        creator = wrap
    }

    return create

    function create(first) {
        var result = creator.apply(this, arguments)
            , id
            , changes = {}

        if (component) {
            id = component.id
        } else if (typeof result === "string") {
            id = result
            result = null
        } else if (result && result.id) {
            id = result.id
        } else if (prefix) {
            id = prefix + ":" + uuid()
        } else if (first.id) {
            id = first.id
        } else {
            id = uuid()
        }

        console.log("id", id, first, result, component)

        if (result) {
            result.id = id
        }

        changes[id] = result

        return changes
    }

    function wrap() {
        return orig !== null ? extend({}, orig) : orig
    }
}
