var emit = require("reducers/emit")

module.exports = initial

function initial(changes) {
    emit(changes, {
        "todo": {
            "1": {
                completed: false
                , title: "foo"
            }
        }
    })

    setTimeout(function () {
        emit(changes, {
            "todo": {
                "1": {
                    completed: true
                    , title: "bar"
                }
            }
        })
    }, 1000)

    setTimeout(function () {
        emit(changes, {
            "todo": {
                "1": null
            }
        })
    }, 2000)
}
