/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true latedef: false globalstrict: true*/
/*global parent:true */

"use strict";

var diff = require("diffpatcher/diff")
var patch = require("diffpatcher/patch")
var rebase = require("diffpatcher/rebase")
var channel = require("reducers/channel")
var timestamp = require("monotonic-timestamp")

var make = Object.create || (function() {
    function Type() {}
    return function make(prototype) {
        Type.prototype = prototype
        return new Type()
    }
})()

// Generated unique name is used to store `delta` on the state object
// which is object containing changes from previous state to current.
var delta = "delta@" + module.id
var id = "uuid@" + module.id
var parent = "parent@" + module.id

// State is a type used for representing application states. Primarily
// reason to have a type is to have an ability implement polymorphic
// methods for it.
function State() {}

// Returns diff that has being applied to a previous state to get to a
// current one.
diff.define(State, function _diff(from, to) {
    // If state does not contains delta property then it's initial,
    // so diff to get to the current state should be a diff itself.
    if (to[parent] === from[id]) {
        return to[delta]
    }

    return diff.calculate(from, to)
})

// Patches given `state` with a given `diff` creating a new state that is
// returned back.
patch.define(State, function patch(state, id, value) {
    var diff = id
    if (arguments.length === 3) {
        diff = {}
        diff[id] = value
    }

    var value = new State()
    // Store `diff` is stored so that it can be retrieved without calculations.
    value[delta] = diff
    value[parent] = state[id]

    return rebase(make(value), state, diff)
})


function state() {
    /**
    Creates an object representing a state snapshot.
    **/
    var value = new State()
    value[id] = timestamp()
    value[parent] = null
    return make(value)
}
state.type = State
state.delta = delta

module.exports = state
