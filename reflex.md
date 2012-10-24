# Reflex

Reflex has a few core components

 - State
 - Input/Output
 - Forks
 - Writer
 - Reader
 - Logic flows
 - Entities

## Diagram

                 _______________________________
                |                               |
                |             Input             |
                |_______________________________|
                    |            |            |
                    ↓            ↓            ↓
                 ________     ________     ________
                |        |   |        |   |        |
                | reader |   | reader |   | reader |
                |   A    |   |   B    |   |   C    |
                |________|   |________|   |________|
                    |            |            |
                    ↓            ↓            ↓
                 _______________________________
     ______     |                               |     ______
    |      | ←~~|                               |~~→ |      |
    | flow |    |             State             |    | flow |
    |______|~~→ |                               | ←~~|______|
                |_______________________________|
                    |            |            |
                    ↓            ↓            ↓
                 ________     ________     ________
                |        |   |        |   |        |
                | fork A |   | fork B |   | fork C |
                |________|   |________|   |________|
                    |            |            |
                    ↓            ↓            ↓
                 ________     ________     ________
                |        |   |        |   |        |
                | writer |   | writer |   | writer |
                |   A    |   |   B    |   |   C    |
                |________|   |________|   |________|
                    |            |            |
                    ↓            ↓            ↓
                 _______________________________
                |                               |
                |            Output             |
                |_______________________________|

## State

state represents the current application state. It's a single object
    with every piece of stateful information your application has.

If you want to change application state you use `patch` to patch
    the current state with a change. The state returned by the
    patch becomes the new current state.

Generally you don't deal with an individual state you deal with
    a stream of states where each value is the current state or
    the last change patched onto the current state.

## Input/Output

Generally your program has some input and output. In a process
    it's stdout and stdin. In a server it's HttpRequest and
    HttpResponse. In an web application it's DOM events and DOM/XHR.

## Forks

Generally you don't want to deal with the entire application state
    in one go. All you care about is handling one small part of it.

This is where Forks come in. A fork is a transformation of the
    stream of states (or state changes) that deals with a subset
    of the entire application state. Conside it a small window
    into your application.

This is awesome because it's a stream of changes to a small part
    of your application and you can then react to them

## Writers

Writers are the reactive part of your application. This includes
    your UI, your database calls, your IO and anything you want
    to write to.

The idea is that there are one or more writers for each fork. A
    writer is in charge handling creation, updates and deletion of
    a piece of data. This could include creating a UI component,
    updating it and deleting it or opening a file, writing to it
    and closing the file descriptor.

## Readers

Readers are things that read user interactions in some format
    or another whether that's stdin or DOM events.

Their job is to normalize the input and turn it into a format
    that is a change in the state. A patch that can be applied
    to the current state of the application.

The change from the input is then fed into the state stream
    and eventually the forks and writers will react to that
    change.

## Logic flows

Logic flows are independant pieces of code that fork the
    application state and react to very specific changes
    which are basically summaries or operations.

They then execute some logic or manipulation and apply
    a series of patches to the central state.

This allowes you to move logic out of your readers into
    self contained pieces of code.

## Entities

entities are both readers and writers. Logic flows are generally
    modeled as entities.

                 _________________________________
                |                                 |
                |                                 |
            ~~→ |              State              | ←~~~
           |    |                                 |     |
           |    |_________________________________|     |
           |           |                  |             |
           |           ↓                  ↓             |
           |        ________           ________         |
           |       |        |         |        |        |
           |       | fork A |         | fork B |        |
           |       |________|         |________|        |
           |           |                  |             |
           |           ↓                  ↓             |
           |     ________________  ________________     |
           |    |    Entity A    ||    Entity B    |    |
           |    | ______________ || ______________ |    |
           |    ||      ||      ||||      ||      ||    |
           | ←~~|| Read || Write|||| Read || Write||~~→ |
                ||   A  ||   A  ||||   A  ||   B  ||
                ||______||______||||______||______||
                |________________||________________|
                     ↑       |         ↑       |
                     |       ↓         |       ↓
                 _______________________________
                |                               |
                |         Input / Output        |
                |_______________________________|

The important part about entities is that they are self contained
    and that they are bound to changes to a small subset of the
    state.

Generally what's happened is that the fork tells the writer a
    new value exists. The writer creates the entity and tells
    the reader to listen on any inputs. The reader returns a
    stream of changes that can be fed back into the state.

The state will then tell the entity of any changes to the state
    so it can react and update the visualization.
