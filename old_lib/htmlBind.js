var unpack = require("unpack-element")
    , forEach = require("for-each")
    , Element = require("fragment").Element
    , ClassList = require("class-list")

    , Writer = require("./writer")

HtmlBind.classList = classList

module.exports = HtmlBind

function HtmlBind(mapping, source) {
    return function (create, update, destroy) {
        return Writer(createElement
            , updateValues
            , destroy)

        function createElement(value, seed) {
            var elements = unpack(Element(source))

            applyMapping(elements, mapping, value)

            create(value, elements, seed)

            return elements
        }

        function updateValues(value, elements, seed) {
            applyMapping(elements, mapping, value)

            update(value, elements, seed)

            return elements
        }
    }
}

function classList(key, className) {
    return function (elements, content) {
        var cl = ClassList(elements[key])
        if (content === true) {
            cl.add(className)
        } else {
            cl.remove(className)
        }
    }
}

function applyMapping(elements, mapping, changes) {
    forEach(mapping, applyChange)

    function applyChange(path, name) {
        var content = changes.value[name]

        if (Array.isArray(path)) {
            path.forEach(recur, name)
        } else if (typeof path === "function") {
            path(elements, content)
        } else {
            var parts = path.split(".")
                , elem = elements[parts[0]]

            elem[parts[1]] = content
        }
    }

    function recur(value) {
        applyChange(value, this)
    }
}
