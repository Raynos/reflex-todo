var expand = require("reducers/expand")
var delta = require("./state").delta

summaries.type = Summary
summaries.isSummary = isSummary

module.exports = summaries

function Summary() {}

function summaries(stream, initial) {
    var previous = initial || {}

    return expand(stream.output, createSummary)

    function createSummary(current) {
        var diff = current[delta]

        var list = Object.keys(diff)
            .map(function (id) {
                var value = diff[id]
                var summary = new Summary()
                var oldValue = previous[id]

                if (!oldValue) {
                    summary.type = "new"
                } else if (value === null) {
                    summary.type = "deleted"
                    summary.oldValue = oldValue
                } else {
                    summary.type = "updated"
                    summary.oldValue = oldValue
                }

                summary.name = id
                summary.value = value

                return summary
            })

        previous = current

        return list
    }
}

function isSummary(summary) {
    return summary instanceof Summary
}
