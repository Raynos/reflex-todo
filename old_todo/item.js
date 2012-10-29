var events = require("dom-reduce/event")
    , map = require("reducers/map")
    , filter = require("reducers/filter")
    , flatten = require("reducers/flatten")
    , prop = require("prop")
    , ClassList = require("class-list")
    , not = require("not")
    , remove = require("insert").remove

    , factory = require("../reflex/factory")
    , entity = require("../reflex/entity")
    , writer = require("../reflex/writer")
    , equal = require("../lib/equal")
    , method = require("../lib/method")
    , forEach = require("../lib/forEach")
    , html = require("../lib/html")
    , todoHtml = require("./html/todo")

    , ENTER = 13

module.exports = entity(
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
