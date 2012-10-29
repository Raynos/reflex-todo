/*global open:true */

var events = require("dom-reduce/event")
    , map = require("reducers/map")
    , flatten = require("reducers/flatten")
    , filter = require("reducers/filter")
    , ClassList = require("class-list")
    , remove = require("insert").remove
    , prop = require("prop")
    , not = require("not")

    , method = require("../lib/method")
    , html = require("../lib/html")
    , forEach = require("../lib/forEach")
    , equal = require("../lib/equal")
    , writer = require("../reflex/writer")
    , entity = require("../reflex/entity")
    , factory = require("../reflex/factory")
    , completedCountHtml = require("./html/completedCount")
    , allCompletedHtml = require("./html/allCompleted")
    , todoHtml = require("./html/todo")
    , todoItem = require("./item")

    , ENTER = 13

module.exports = {
    completedCount: entity(
        function read(component) {
            var clicks = events(component.clear, "click")

            return map(clicks, factory({
                id: "operation"
                , value: "clearCompleted"
            }))
        }
        , writer(function swap(component, counter) {
            component.completedCount.textContent = counter.completed
        }, function open(options, value) {
            return html(completedCountHtml)
        }))
    , allCompleted: entity(
        function read(component) {
            var clicks = events(component.all, "click")

            return map(clicks, factory({
                id: "operation"
                , value: "allCompleted"
            }))
        }
        , writer(function swap(component, counter) {
            var all = component.all
                , remaining = counter.remaining
                , completed = counter.completed

            if (remaining === 0 && completed > 0) {
                all.checked = true
            } else {
                all.checked = false
            }
        }, function open(options, value) {
            return html(allCompletedHtml)
        }))
    , todo: todoItem
}
