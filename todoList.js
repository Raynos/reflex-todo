var unpack = require("unpack-element")
    , Element = require("fragment").Element
    , chain = require("chain-stream")
    , extend = require("xtend")
    , ReadStream = require("read-write-stream")
    , iterators = require("iterators")
    , events = require("events-stream")
    , prop = require("prop")
    , uuid = require("node-uuid")
    , ClassList = require("class-list")

    , todoListHtml = require("./todoList.html")
    , equal = require("./lib/equal")
    , todoHtml = require("./todo.html")
    , HtmlBind = require("./lib/htmlBind")

    , writer = HtmlBind({
        "completed": [
            HtmlBind.classList("root", "completed")
            , "toggle.checked"
        ]
        , "title": [
            "text.textContent"
            , "input.value"
        ]
    }, todoHtml)(create, noop, destroy)
    , ENTER = 13

module.exports = TodoListComponent

function TodoListComponent(summaries) {
    var component = unpack(Element(todoListHtml))
        , queue = component.queue = ReadStream()
        , inputEvents = events(component.input, "keypress")
        , toggleEvents = events(component.all, "change")
        , clearEvents = events(component.clear, "click")
        , ids
        , completed

    chain(summaries)
        .reductions(accumulateIds, {})
        .forEach(function (_ids) {
            ids = _ids
        })

    var counters = chain(summaries)
        .reductions(function (acc, changes) {
            var completed = changes.value.completed
                , id = changes.name
                , counters = {
                    completed: extend({}, acc.completed)
                    , outstanding: extend({}, acc.outstanding)
                }

            if (changes.type === "new") {
                if (completed) {
                    counters.completed[id] = true
                } else {
                    counters.outstanding[id] = true
                }
            } else if (changes.type === "deleted") {
                delete counters.completed[id]
                ;delete counters.outstanding[id]
            } else if (changes.type === "updated") {
                if (completed) {
                    counters.completed[id] = true
                    ;delete counters.outstanding[id]
                } else {
                    counters.outstanding[id] = true
                    ;delete counters.completed[id]
                }
            }

            return counters
        }, {
            completed: {}
            , outstanding: {}
        })

    chain(summaries)
        .reductions(function (acc, changes) {
            var isCompleted = changes.value.completed
                , isDeleted = changes.value.__deleted__
                , completed = extend({}, acc)
                , id = changes.name

            if (isCompleted && !isDeleted) {
                completed[id] = true
            } else {
                delete completed[id]
            }

            return completed
        }, {})
        .forEach(function (_completed) {
            completed = _completed
        })

    chain.forEach(clearEvents, function () {
        iterators(completed)
            .map(function (bool, id) {
                return {
                    id: id
                    , __deleted__: true
                }
            })
            .forEach(queue.push)
    })

    counters.forEach(function (counter) {
        var outstanding = counter.outstanding
            , count = Object.keys(outstanding).length
            , countText = component.countText

        component.count.textContent = count

        if (count === 1) {
            countText.textContent = "item left"
        } else {
            countText.textContent = "items left"
        }
    })

    counters.forEach(function (counter) {
        var completed = Object.keys(counter.completed).length
            , outstanding = Object.keys(counter.outstanding).length

        if (outstanding === 0 && completed > 0) {
            component.all.checked = true
        } else {
            component.all.checked = false
        }
    })

    chain(toggleEvents)
        .map(prop("target.checked"))
        .forEach(function (checked) {
            iterators(ids)
                .filter(equal(null, true))
                .map(function (value, id) {
                    return {
                        id: id
                        , completed: checked
                    }
                })
                .forEach(queue.push)
        })

    chain(inputEvents)
        .filter(equal("keyCode", ENTER))
        .map(getValue)
        .filter(toBoolean)
        .map(method("trim"))
        .map(function (title) {
            return {
                id: uuid()
                , title: title
                , completed: false
            }
        })
        .forEach(queue.push)

    // Write change summaries to component
    writer(summaries, component)

    return {
        stream: queue.stream
        , root: component.root
    }
}

function create(changes, elements, component) {
    var id = changes.value.id
        , changesEvents = events(elements.toggle, "change")
        , destroyEvents = events(elements.destroy, "click")
        , editEvents = events(elements.text, "dblclick")
        , blurEvents = events(elements.input, "blur")
        , saveEvents = events(elements.input, "keypress")

    var saves = chain(saveEvents)
        .filter(equal("keyCode", ENTER))
        .concat(blurEvents)

    var values = saves
        .map(prop("target.value"))
        .map(method("trim"))

    values
        .remove(toBoolean)
        .map(function () {
            return {
                id: id
                , __deleted__: true
            }
        })
        .forEach(component.queue.push)

    values
        .filter(toBoolean)
        .map(function (title) {
            return {
                id: id
                , title: title
            }
        })
        .forEach(component.queue.push)

    values
        .forEach(function () {
            ClassList(elements.root).remove("editing")
        })


    chain(changesEvents)
        .map(prop("target.checked"))
        .map(function (checked) {
            return {
                id: id
                , completed: checked
            }
        })
        .forEach(component.queue.push)

    chain(destroyEvents)
        .map(function () {
            return {
                id: id
                , __deleted__: true
            }
        })
        .forEach(component.queue.push)

    chain(editEvents)
        .forEach(function () {
            ClassList(elements.root).add("editing")
            elements.input.focus()
        })

    component.list.appendChild(elements.root)

    elements.changesEvents = changesEvents
    elements.destroyEvents = destroyEvents
}

function destroy(value, elements, component) {
    component.list.removeChild(elements.root)

    elements.changesEvents.close()
    elements.destroyEvents.close()
}

function noop() {}

function toBoolean(value) {
    return !!value
}

function getValue(event) {
    var input = event.target
        , value = input.value

    input.value = ""

    return value
}

function method(name) {
    return function (item) {
        return item[name]()
    }
}

function accumulateIds(ids, changes) {
    var id = changes.name

    if (changes.type === "new") {
        ids[id] = true
    } else if (changes.type === "deleted") {
        ids[id] = null
    }

    return ids
}
