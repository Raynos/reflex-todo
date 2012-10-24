/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true browser: true devel: true
         forin: true latedef: false globalstrict: true*/

"use strict";

var reduce = require("reducers/reduce")

function writer(swap, open, close) {
    /**
    Writer allows you to create write functions like this one:
    function html(tagName) {
        return writer(function swap(element, state) {
            element.textContent = state
        }, function open(state) {
            return document.createElement(tagName)
        }, function close(element) {
            if (element.parentElement)
            element.parentElement.removeChild(element)
        })
    }
    var h1 = html("h1")
    var input = channel()

    var element = h1(input)
    element.outerHTML // => <h1></h1>

    enqueue(channel, "hello")
    element.outerHTML // => <h1>hello</h1>
    **/

    return function write(input, options) {
        var output = open(options)
        reduce(input, function(_, update) {
            if (update === null) {
                close(output, options)
            } else {
                swap(output, update)
            }
        })
        return output
    }
}

module.exports = writer
