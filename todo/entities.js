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
    , todo: entity(
        function read(component) {
            var changesEvents = events(component.toggle, "change")
                , checks = map(changesEvents, prop("target.checked"))
                , completions = map(checks
                    , factory(component, function (completed) {
                        return {
                            completed: completed
                        }
                    }))

            var destroyEvents = events(component.destroy, "click")
                , destructions = map(destroyEvents
                    , factory(component, null))

            var input = component.input
                , root = component.root
                , blurEvents = events(input, "blur")
                , keyEvents = events(input, "keypress")

            forEach(filter(keyEvents, equal("keyCode", ENTER))
                , function (event) {
                    event.target.blur()
                })

            var values = map(blurEvents, prop("target.value"))
                , trimmed = map(values, method("trim"))

            forEach(trimmed, function () {
                ClassList(root).remove("editing")
            })

            var deletions = map(
                filter(values, not(Boolean))
                , factory(component, null))

            var changes = map(
                filter(values, Boolean)
                , factory(component, function (text) {
                    return {
                        title: text
                    }
                }))

            return flatten([ destructions, completions
                , changes, deletions ])
        }
        , writer(function swap(component, value) {
            if ("title" in value) {
                component.text.textContent = value.title
                component.input.value = value.title
            }

            if ("completed" in value) {
                var completed = value.completed

                component.toggle.checked = value.completed

                if (completed) {
                    ClassList(component.root).add("completed")
                } else {
                    ClassList(component.root).remove("completed")
                }
            }
        }, function open(options, value) {
            var component = html(todoHtml)
                , input = component.input
                , root = component.root

            component.id = value.id

            forEach(events(component.text, "dblclick")
                , function (event) {
                    ClassList(root).add("editing")
                    input.focus()
                })

            return component
        }, function close(component) {
            remove(component.root)
        }))
}
