module.exports = method

function method(name) {
    return function (item) {
        return item[name]()
    }
}
