var emit = require("reducers/emit")

module.exports = initial

function initial(state) {
    emit(state, {
        "todo:1": {
            completed: false
            , title: "foo"
        }
    })

    setTimeout(function () {
        emit(state, {
            "todo:1": {
                completed: true
                , title: "bar"
            }
        })
    }, 1000)

    setTimeout(function () {
        emit(state, {
            "todo:1": null
        })
    }, 2000)
}
