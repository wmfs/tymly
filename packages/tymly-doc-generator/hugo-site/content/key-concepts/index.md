---
date: 2016-03-09T00:11:02+01:00
title: Key Concepts
weight: 10
---

## Blueprints

In Tymly, a "__blueprint__" describes related functionality that adds value to an organization.
Typically a blueprint will describe all the workflows, rules and forms affecting a business function or team - but they're equally suited to describing open data and ETL pipelines.

![Cartoon illustration of people looking inside a Blueprint](/images/inside-a-blueprint.png#center)

Blueprints equate to a directory containing a simple `blueprint.json` file and one-or-more sub-directories:

| Sub-directory | Description |
| ------------- | ----------- |
| `/functions` | Blueprints are predominantly declarative - preferring JSON definitions over hand-coded functions. But for those times when only code will do, blueprints can supply supplemental Javascript functions too. |
| `/registry-keys` | Consider a blueprint that defines a simple workflow that sends a Tweet - what Twitter username/password should be used? This is where _Registry Keys_ come in useful... a simple key/value store inside Tymly, where keys are declared inside this sub-directory. To help conjure administrative screens and help validation, the required value content is described using JSON Schema. |
| `/state-machines` | Each JSON file inside this sub-directory will be used to conjure a State Machine for orchestrating a workflow. Tymly uses the open [Amazon State Language](https://states-language.net/spec.html) to describe State Machines. |
| `/models` | This sub-directory deals with the `M` portion of `MVC` - each JSON file in here defines a data model that can be subsequently used by a State Machine. Nested documents are supported along with a couple of extensions to help describe database indexes and primary keys. Tymly uses the JSON Schema standard for describing data models. |
| `/tags` | JSON files providing &#39;tags&#39; which are used throughout Tymly to help categorise things and aid discovery |
| `/images` | A place to put images that can be served-up in Forms and similar |
| `/forms` | One JSON file per Form (currently need to be in [Schemaform](http://schemaform.io/) format) |
| `/rankings` | Each JSON file here will help configure everything required to rank a set of documents by a score derived from a variety of sources |
| `/search-docs` | Each JSON file is used to translates a model document into standard properties for searching. |

![Yeoman logo](/images/yeoman.png#floatleft) __We use [Yeoman](http://yeoman.io/) to help quickly scaffold new components in Tymly.__

Running the `yo tymly:blueprint` command will get you building basic blueprints in no time. Please see the [Getting started](/getting-started/) section for help with setting-up Yeoman.

<div style="clear: both;"></div>

---

## State Machines

All the events that occur inside Tymly are orchestrated by an army of ~~Finite~~ [State Machines](https://en.wikipedia.org/wiki/Finite-state_machine).
Conceptually, a State Machine is nothing more than a collection of [States](https://states-language.net/spec.html#states-fields) that are wired together to describe an executable process.
Each state needs to be assigned a __Type__, some examples:

* __[Task](https://states-language.net/spec.html#task-state)__ states are where all the heavy-lifting is done. Tasks cover all manner of processing: importing data, sending e-mails, form-filling etc.
* __[Choice](https://states-language.net/spec.html#choice-state)__ states are used to implement conditional branching inside a state machine (i.e. configuring states so that they execute only if a certain expression is satisfied).
* __[Parallel](https://states-language.net/spec.html#parallel-state)__ states allow for the concurrent running of two or more states.

If Tymly were to be considered in terms of Model, View, Controller... then State Machines are all about the _Controller_.
Tymly uses the open [Amazon States Specification](https://states-language.net/spec.html) to define State Machines inside blueprints, as such, the following State Machine constructs are supported:

<table >
    <tr>
        <th>Sequential</th>
        <th>Choice</th>
        <th>Parallel</th>
    </tr>
    <tr>
        <td><img src="/images/sequential-states.png"/></td>
        <td><img src="/images/choice-states.png"/></td>
        <td><img src="/images/parallel-states.png"></td>
    </tr>
<tr>
<td>
<pre style="margin:0; padding:1em;">
{
 "States": {
  "Load": {
   "Type": "Task",
   "Resource": "module:findingById",
   "InputPath": "$.key",
   "Next": "Form"
  },
  "Form": {
   "Type": "Task",
   "Resource": "module:formFilling",
   "ResultPath": "$.formData",
   "Next": "Save"
  },
  "Save": {
   "Type": "Task",
   "Resource": "module:upserting",
   "InputPath": "$.formData",
   "End": "True"
  }
 }
}
</pre>
</td>

<td>
<pre style="margin:0;padding:1em;">
{
 "States": {
  "ConsiderLanguage": {
   "Type": "Choice",
   "Choices": [
    {
     "Variable": "$.language",
     "StringEquals": "Spanish"
     "Next": "SpanishGreeting"
    }
   ],
   "Default": "EnglishGreeting"
  },
  "SpanishGreeting": {
   "Type": "Task",
   "Resource": "module:logging",
   "ResourceConfig": {
    "template": "Hola"
   },
   "End": "True"
  },
  "EnglishGreeting": {
   "Type": "Task",
   "Resource": "module:logging",
   "ResourceConfig": {
    "template": "Hello"
   },
   "End": "True"
  }
 }
}
</pre>
</td>

<td>
<pre style="margin:0;padding:1em;">
{
 "States": {
  "ParallelThings": {
   "Type": "Parallel",
   "Branches": [
    {
     "StartAt": "ProcessAvatar",
     "States": {
      "ProcessAvatar" : {
       "Type": "Task",
       "Resource": "module:crop"
       "End": true
      }
     }
    },
    {
     "StartAt": "CreateAccount",
     "States": {
      "CreateAccount" : {
       "Type": "Task",
       "Resource": "module:onboard"
       "End": true
      }
     }
    }
   ],
   "Next": "SendWelcomeEmail"
  },
  "SendWelcomeEmail": {
   "Type": "Task",
   "Resource": "module:sendEmail"
   "End": true
  }
 }
}
</pre>
</td>
</tr>
</table>

---

## Resources

If the purpose of a State Machine is to execute Task states in a controlled manner, then it could be argued Tymly isn't too dissimilar to a microservice architecture.
That said, instead of coordinating remote services over HTTP, Tymly State Machines orchestrate plain-old Javascript object instances.
In Tymly, these objects are conjured from simple classes termed "__Resources__". Each Task State therefore needs to be associated with a single _resource_.

![A state machine containing two form-filling state tasks](/images/double-form-state-machine.png#center)

In the State Machine illustrated above we have a couple of Task states (one for showing an order-form to a user and a second for showing a survey-form).
Though these states will be configured differently inside the State Machine JSON, they'll both be associated with a common `formFilling` __resource__.

![Yeoman logo](/images/yeoman.png#floatleft)
As described below, Tymly is extended through a plugin mechanism which can supply new-and-exciting resources. Again, Yeoman is used to help get things started, the `yo tymly:resource` will scaffold a basic resource for you to hack around with.

__Please see the [list of core resources](/reference/#list-of-state-resources) for more detailed information about the type of thing possible out-of-the-box with Tymly.__

<div style="clear: both;"></div>

---

## Plugins

Tymly takes a batteries-included approach and hopefully ships with enough [Resources](/reference/#list-of-state-resources) to cover-off most of the the duller business processes out there
To help try and keep things minimal and manageable, Resources (and other components) are bundled inside Tymly "__Plugins__". The following are available out-of-the-box:

| Plugin | Description |
| ------ | ----------- |
| [tymly](https://github.com/wmfs/tymly#readme) | The [Tymly](https://github.com/wmfs/tymly/tree/master/packages/tymly) package itself has a [built-in plugin](https://github.com/wmfs/tymly/tree/master/packages/tymly/lib/plugin) which provides low-level components to help get the party started |
| [tymly-alerts-plugin](https://github.com/wmfs/tymly#readme) | Adds some alerting options to the Tymly framework |
| [tymly-etl-plugin](https://github.com/wmfs/tymly#readme) | A collection of states for helping with Extract, Transform and Load tasks. |
| [tymly-express-plugin](https://github.com/wmfs/tymly#readme) | Exposes the Tymly framework via an Express.js web app. |
| [tymly-forms-plugin](https://github.com/wmfs/tymly#readme) | Adds some form capabilities to Tymly |
| [tymly-pg-plugin](https://github.com/wmfs/tymly#readme) | Replace Tymly&#39;s out-the-box memory storage with PostgreSQL |
| [tymly-rankings-plugin](https://github.com/wmfs/tymly#readme) | Plugin which handles ranking of data |
| [tymly-solr-plugin](https://github.com/wmfs/tymly#readme) | Plugin which handles interaction with Apache Solr |

![Yeoman logo](/images/yeoman.png#floatleft)
Organizations will undoubtedly have specialist requirements of their own - this is where plugins shine, allowing Tymly to be easily extended and adapted as required.

And again, Yeoman can help things along. Running `yo tymly:plugin` will generate a skeleton plugin into which new resources and related components can be added.

<div style="clear: both;"></div>

---