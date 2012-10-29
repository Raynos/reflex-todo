module.exports = attribute

function attribute(name) {
    return function (item) {
        return item[name]
    }
}
