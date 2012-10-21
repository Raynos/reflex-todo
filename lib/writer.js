var chain = require("chain-stream")

module.exports = Writer

function Writer(create, update, destroy) {
    return write

    function write(input, seed) {
        var hash = {}

        chain.forEach(input, applyChange)

        function applyChange(value) {
            var name = value.name

            if (value.type === "new") {
                hash[name] = create(value, seed)
            } else if (value.type === "updated") {
                hash[name] = update(value, hash[name], seed)
            } else if (value.type === "deleted") {
                destroy(value, hash[name], seed)
                hash[name] = null
            }
        }
    }
}
