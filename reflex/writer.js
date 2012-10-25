/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true browser: true devel: true
         forin: true latedef: false globalstrict: true*/

"use strict";

var reduce = require("reducers/reduce")
var buffer = require("reducers/buffer")
var channel = require("reducers/channel")
var emit = require("reducers/emit")
var isSummary = require("./summaries").isSummary

function writer(swap, open, close) {
    var hash = {}

    return function write(input, options) {
        var stream = buffer(channel())
        var output

        // var output = open(options)
        reduce(input, function(_, update) {
            if (isSummary(update)) {
                return handleSummary(update)
            }

            if (!output) {
                output = open(options)
                emit(stream, output)
            }

            if (update === null) {
                close(output, options)
            } else {
                swap(output, update)
            }
        })

        return stream

        function handleSummary(update) {
            var id = update.name
            var value = update.value
            var type = update.type
            var oldValue = update.oldValue
            var current = hash[id]
            var res

            if (type === "new") {
                var output = hash[id] = open(options, value)

                res = swap(output, value)

                emit(stream, output)
            } else if (type === "updated") {
                res = swap(current, value, oldValue)
            } else if (type === "deleted") {
                close(current, options)
                ;delete hash[id]
            }

            if (res) {
                hash[id] = res
            }
        }
    }
}

module.exports = writer
