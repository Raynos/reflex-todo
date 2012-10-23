var chain = require("chain-stream")
    , ReadStream = require("read-stream")
    , forEach = chain.forEach
    , toArray = require("to-array")

module.exports = ListWidget

/*
    ListWidget(
        create Func<input, parent, value> -> component
        , update Func<value, oldValue, component>
        , destroy Func<component, parent>
        , children Array[Func<input, component> -> Stream]
    ) -> Func<input, Stream<summary>, parent> -> Stream

    ListWidget is a function which takes a creation, updation,
        deletion and a list of child widgets

    A ListWidget is like a Widget but creates one Widget for
        each unique value in the list.

    It returns a function which takes the input state, a stream
        of change summaries for a list of values and a parent
        widget and returns a readable stream of changes

    The result represents all the changes that should be applied
        to the state based on user interactions with the list
        of widgets.

    When the change summaries tells us that we have a new id
        we have not seen before then call `create(input, parent)`
        to create a fresh component.

    Once a component has been created call
    `update(value, oldValue, component)` to update the component
    with the fresh state.

    Also call the children function with the input state and the
        component and merge those into a stream of changes which
        we feed into the result of the ListWidget.

    If the stream of change summaries contains an update to a
        value then the update function will be called
        and if it contains a deletion then the destroy
        function will be called.

*/
function ListWidget(create, update, destroy, children) {
    var hash = {}
    children = children || []

    return function (input, list, parent) {
        var queue = ReadStream()

        forEach(list, function (summary) {
            var type = summary.type
                , id = summary.name
                , value = summary.value
                , oldValue = summary.oldValue || null
                , component = hash[id]

            if (type === "new") {
                component = hash[id] = create(input, parent, summary)

                update(value, oldValue, component)

                children
                    .map(function (f) {
                        return f(input, component)
                    })
                    .filter(toBoolean)
                    .forEach(mergeStream, queue.push)
            } else if (type === "updated") {
                update(value, oldValue, component)
            } else if (type === "deleted") {
                destroy(component, parent)
            }
        })

        return queue.stream
    }
}

function mergeStream(stream) {
    forEach(stream, this)
}

function toBoolean(value) {
    return !!value
}
