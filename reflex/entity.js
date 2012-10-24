module.exports = entity

function entity(read, write) {
    return function make(input, options) {
        // Create / hook an instance using options passed
        var instance = write(input, options)
        var output = read(instance)
        output.view = instance
        return output
    }
}
