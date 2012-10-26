/*global open:true */

var open = require("dom-reduce/event")
    , filter = require("reducers/filter")
    , map = require("reducers/map")

    , factory = require("../reflex/factory")
    , equal = require("../lib/equal")
    , method = require("../lib/method")

    , ENTER = 13

module.exports = {
    input: function read(component) {
        var events = open(component.input, "keypress")
            , enters = filter(events, equal("keyCode", ENTER))
            , values = filter(map(enters, getFieldValue), Boolean)
            , trimmed = map(values, method("trim"))
            , todos = map(trimmed
                , factory("todo", function (title) {
                    return {
                        title: title
                        , completed: false
                    }
                }))

        return todos
    }
}

function getFieldValue(event) {
    var input = event.target
        , value = input.value

    input.value = ""

    return value
}
