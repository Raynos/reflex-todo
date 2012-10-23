var chain = require("chain-stream")
    , ReadStream = require("read-stream")
    , concat = chain.concat
    , forEach = chain.forEach
    , toArray = require("to-array")

module.exports = Widget

/*
    Widget(
        create Func<input, parent> -> component
        , children Array[Func<input, component> -> Stream]
    ) -> Func<input, parent> -> Stream

    Widget is a function which takes a creation function and
        a list of child widgets

    It returns a function which takes the input state and the
        parent widget and returns a readable stream of changes

    The result represents all the changes that should be applied
        to the state based on user interactions with this widget

    For each of the changes in the resulting stream you should
        apply a patch of the change to your state

    The creation function is called to create the component for
        this widget

    Each child widget will be called with the input and the
        component. If a child widget returns a stream then
        it will be merged into the changes stream this widget
        returns
*/
function Widget(create, children) {
    children = children || []

    return function (input, parent) {
        var component = create(input, parent)

        return concat.apply(null, children.map(function (f) {
            return f(input, component)
        }).filter(toBoolean))
    }
}

function toBoolean(value) {
    return !!value
}
