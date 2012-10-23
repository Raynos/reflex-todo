

// function create(changes, elements, component) {
//     var id = changes.value.id
//         , changesEvents = events(elements.toggle, "change")
//         , destroyEvents = events(elements.destroy, "click")
//         , editEvents = events(elements.text, "dblclick")
//         , blurEvents = events(elements.input, "blur")
//         , saveEvents = events(elements.input, "keypress")

//     var saves = chain(saveEvents)
//         .filter(equal("keyCode", ENTER))
//         .concat(blurEvents)

//     var values = saves
//         .map(prop("target.value"))
//         .map(method("trim"))

//     values
//         .remove(toBoolean)
//         .map(function () {
//             return {
//                 id: id
//                 , __deleted__: true
//             }
//         })
//         .forEach(component.queue.push)

//     values
//         .filter(toBoolean)
//         .map(function (title) {
//             return {
//                 id: id
//                 , title: title
//             }
//         })
//         .forEach(component.queue.push)

//     values
//         .forEach(function () {
//             ClassList(elements.root).remove("editing")
//         })


//     chain(changesEvents)
//         .map(prop("target.checked"))
//         .map(function (checked) {
//             return {
//                 id: id
//                 , completed: checked
//             }
//         })
//         .forEach(component.queue.push)

//     chain(destroyEvents)
//         .map(function () {
//             return {
//                 id: id
//                 , __deleted__: true
//             }
//         })
//         .forEach(component.queue.push)

//     chain(editEvents)
//         .forEach(function () {
//             ClassList(elements.root).add("editing")
//             elements.input.focus()
//         })

//     component.list.appendChild(elements.root)

//     elements.changesEvents = changesEvents
//     elements.destroyEvents = destroyEvents
// }

// function destroy(value, elements, component) {
//     component.list.removeChild(elements.root)

//     elements.changesEvents.close()
//     elements.destroyEvents.close()
// }

// function noop() {}

// function toBoolean(value) {
//     return !!value
// }

// function getValue(event) {
//     var input = event.target
//         , value = input.value

//     input.value = ""

//     return value
// }

// function method(name) {
//     return function (item) {
//         return item[name]()
//     }
// }

// function accumulateIds(ids, changes) {
//     var id = changes.name

//     if (changes.type === "new") {
//         ids[id] = true
//     } else if (changes.type === "deleted") {
//         ids[id] = null
//     }

//     return ids
// }
