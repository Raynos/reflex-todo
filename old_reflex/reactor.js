


function reactor(children) {
    return function (input) {
        return flatten(
            children.map(
                )
        )

        options.forEach(function (tuple) {
            var forker = tuple[0]
            var component = tuple[1]

            var fork = forker(input)
            var result = component(fork)
            output = merge(output, result)
        })

        return output
    }
}
