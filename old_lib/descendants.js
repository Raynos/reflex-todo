var walk = require("dom-walk")

module.exports = Descendants

function Descendants(root) {
    var queue = []

    walk([root], function (elem) {
        queue.push(elem)
    })

    return queue
}
