var forEach = require("chain-stream").forEach

/*
    Writer(
        fork Func<input> -> Stream
        , render Func<current, component>
    ) -> Func<input, component>

    Writer takes a forking function and a rendering function
        it then returns a function that takes an input and
        a component (Widget compatible interface.)

    When it's called it will use the forking function to fork
        the input and then call render for each value in the
        stream returned from fork with the value and the component
        passed in initially.
*/
module.exports = Writer

function Writer(fork, render) {
    return function (input, component) {
        forEach(fork(input), function (value) {
            render(value, component)
        })
    }
}
