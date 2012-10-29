Stream changes
Object options
Mutable readable

function Writer(update, open, close) {
    return write
}

function update(readable, change) {
    update readable
}

function open(options) {
    return create readable
}

function close(readable, options) {
    destruct readable
}

function Atom(read, write) {
    return react
}

function read(readable) {
    return input
}

function write(changesStream, options) {
    return readable
}

function react(changesStream, options) {
    return input
}

function Compound(
    mapping<query, react>
    // Not sure how to do overlay
    , overlay<query, fork>
) {
    return react
}

// Not sure ???
function fork(changes) {
    return changes
}
