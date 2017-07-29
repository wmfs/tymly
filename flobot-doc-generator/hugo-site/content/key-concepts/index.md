---
date: 2016-03-09T00:11:02+01:00
title: Key Concepts
weight: 10
---

## Flows

__Everything in FlobotJS is built around a flow.__

- An organisation is likely to contain hundreds of business processes. In FlobotJS, each of these processes can be modelled as a "__flow__". Flows can underpin something as simple as a user searching for a document through to  a complex multi-team endeavour.

- Flows may involve lots of people or may require no human input at all. It's likely an employee's role will require interaction with several flows - but probably not all of them.

- Flows play nicely with industry representations such as [State Diagrams](https://en.wikipedia.org/wiki/State_diagram), [Activity Diagrams](https://en.wikipedia.org/wiki/Activity_diagram) and [Business Process Diagrams](http://www.bpmn.org/).

### The booking-someone-sick flow

The flow represented in the diagram below allows an Operator (or more accurately a _user_ who has been assigned the Operator _role_) to process the necessary housekeeping when someone phones-in sick.

![Simple state diagram for booking-someone-sick](/images/simple-flow.png)

- As described in the next section, each  circle in this diagram is known as a [State](#states). The _initial_ state requires the operator to capture details of the sickness by filling-in a quick form.

- Once the form has been completed, the flow advances to a state where an email is sent to the employee's manager.

- What state the flow moves to next is dependent on whether the absence will reduce staffing below some critical level. Either things are fine and the flow can move to the final state or the Operations Room will be alerted to a staffing shortfall.

- And to finish, the employee will have a new entry added to their sickness record.

<hr>

## States

Each of the circles in the previous diagram are known as __States__.  Each Flobot flow contains all the necessary information to assemble a [Finite State Machine] (https://en.wikipedia.org/wiki/State_diagram) (__FSM__), that being:

- A list of possible states (an FSM can be in exactly one of a finite number of states at any given time)

- How states are connected together (along with any conditions that are required)

- Which state the FSM should find itself in as it starts (i.e. the flow's _initial_ state)

FlobotJS provides a pool of different [State Classes](/reference/#list-of-state-classes), each state in a flow will be associated with a particular _State Class_. It's possible to deliver a good chunk of back-office functionality with surprisingly few State Classes.

__For a full list of states that are currently available out-of-the-box, please see the [list of core states](/reference/#list-of-state-classes).__

<hr>

## Flobots

At this point it _might_  be useful to think of things in terms of a railway network...

{{< note title="Analogy alert!" >}}
  
- __Flows__ can be seen as the railway track - connecting states together in a very controlled way

- __States__ can be seen as the railway stations - they're reached by travelling around flows. Journeys start at the _initial_ state.

- __Flobots__ therefore can be seen as trains as they move from state-to-state. A single flow can have any number of Flobots making their way around it.

{{< /note >}}

Flobots are always persisted as a simple document so that they can survive server restarts.
This is an example of what might be persisted for a Flobot travelling around the __booking-someone-sick__ flow from earlier: 

``` JSON
{ 
    "_id" : "586e42ade923c119c4a4a85b", 
    "createdAt" : "2017-01-05T12:57:17.701+0000",
    "userId" : "john.doe@flobotjs.io", 
    "status" : "running", 
    "flowId" : "booking-someone-sick", 
    "stateId" : "notifyingOperationsRoom", 
    "stateEnterTime" : "2017-01-05T12:57:17.686+0000", 
    "ctx" : {
        "formData" : {
            "employeeNumber": 372711,
            "likelyReturnDate": "2017-01-07T09:00:00.000+0000",
            "sicknessCode": "hangover"
        }
    }
}
```

The various properties in this example document are described in the table below:

Property         | Description
---------------- | ---------------------------------
`_id`            | Uniquely identifies a Flobot
`createdAt`      | When the Flobot was first instigated
`userId`         | If the Flobot was instigated by a human, then this is the userId of that person 
`status`         | Always one of `starting`, `running`, `waitingForHumanInput` or `finished`
`flowId`         | Identifies which flow this Flobot is travelling around
`stateId`        | Indicates the state that this Flobot is currently in
`stateEnterTime` | The timestamp of when the Flobot entered its current state
`ctx`            | This is a simple key/value store that's unique to each Flobot. In analogy terms, this is a good place to store the speed of a train. This __context__ is available to all states to read-from/write-to as they require. In this way, inter-state communication is possible - but within context of each ~~train~~ Flobot.

<hr>

## Blueprints

On their own, flow definitions aren't enough... for everything to spark, states need to be fed things like data models, form layouts, images, custom logic, templates etc.
This is where FlobotJS __Blueprints__ come in. The actual content of a Blueprint is beyond the scope of this article, but just to say Blueprints themselves are nothing special, just a simple folder structure:

| Directory | Description |
| --------- | ----------- |
| `/flows` | Flow definitions defined in JSON files |
| `/functions` | One file per Node.js module (which should export a single function). |
| `/registryKeys` | A collection of JSON files which are used to create entries in the Flobot registry. |
| `/models` | One JSON file per model (contents to be a JSON schema for defining the model&#39;s data structure) |
| `/tags` | JSON files providing &#39;tags&#39; which are used throughout Flobot to help categorise things and aid discovery |
| `/images` | A place to put images that can be served-up in Forms and similar |
| `/forms` | One JSON file per Form (currently need to be in [Schemaform](http://schemaform.io/) format) |

Given an organisation could potentially attract hundreds of flows, blueprints can logically group together related flows (perhaps into teams or functional areas) to help make things more manageable.
Blueprints also help with versioning, collaboration (on Github or similar) and interoperability. 

The FlobotJS framework can load any number of blueprints at startup, potentially serving all back-office functionality from a single server.

<hr>

## Plugins

FlobotJS takes a batteries-included approach and hopefully ships with enough [State Classes](#states) to cover-off most of the the duller business processes out there. To help try and keep things minimal and manageable Flobot employs a __plugin__ architecture.
A FlobotJS plugin extends the core framework with related State Classes (along with other internal components required to run them).

__Please see the [list of core plugins](/reference/#list-of-plugins) to get a feel for what plugins are all about__

FlobotJS's current library of state classes is certainly far from exhaustive and organisations will undoubtedly have specialist requirements of their own.
It's straightforward to write a new plugin for FlobotJS and add missing capabilities.





 
 
