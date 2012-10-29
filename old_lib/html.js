var unpack = require("unpack-element")
    , Element = require("fragment").Element

module.exports = html

function html(src) {
    return unpack(Element(src))
}
