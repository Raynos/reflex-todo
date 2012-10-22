module.exports = initial

function initial(state) {
    state.patch("todo:1", {
        completed: false
        , title: "foo"
    })

    setTimeout(function () {
        state.patch("todo:1", {
            completed: true
            , title: "bar"
        })
    }, 1000)

    setTimeout(function () {
        state.patch("todo:1", null)
    }, 2000)
}
