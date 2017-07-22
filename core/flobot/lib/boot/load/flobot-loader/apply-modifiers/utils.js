'use strict'

const _ = require('lodash')
const sprintf = require('sprintf-js').sprintf
const messages = require('./../../../../startup-messages')

module.exports = {

  isFsmOptions: function isFsmOptions (ctx) {
    return ctx.componentName === 'flows' &&
      ctx.componentPath[2] === 'fsm' &&
      ctx.componentPath[4] === 'options' &&
      ctx.componentPath.length === 5
  },

  idNamespacer: function idNamespace (targetKey, blueprintComponentName, ctx) {
    function processObject (rootObject) {
      if (_.isArray(rootObject)) {
        rootObject.forEach(
          function (arrayElement) {
            processObject(arrayElement)
          }
        )
      } else if (_.isObject(rootObject)) {
        let originalValue
        let componentId
        let component
        let foundMatch

        for (let key in rootObject) {
          if (rootObject.hasOwnProperty(key)) {
            if (key === targetKey) {
              originalValue = rootObject[key]

              if (_.isString(originalValue)) {
                // TODO: Must. Learn. Lodash.
                foundMatch = false
                for (componentId in components) {
                  if (components.hasOwnProperty(componentId)) {
                    component = components[componentId]

                    if (component.name === originalValue) {
                      foundMatch = true
                      rootObject[key] = componentId
                    } else {
                      // So not namespacing... but, another service might have been around these
                      // parts already, and so the original value is already namespaced.
                      // If it looks like that's happened, then consider it a match already.
                      //
                      // Also ignore the "*" wildcard character - as used when authorizing and similar

                      if (originalValue === componentId || originalValue === '*') {
                        foundMatch = true
                      }
                    }
                  }
                }
                if (!foundMatch) {
                  messages.error(
                    {
                      name: 'unknownDependency',
                      message: sprintf("Unable to namespace '%s' in %s (processing key %s as referenced at: %s)", originalValue, blueprintComponentName, targetKey, ctx.componentPath.join('.'))
                    }
                  )
                }
              }
            }

            processObject(rootObject[key])
          }
        }
      }
    }

    const components = ctx.blueprintComponents[blueprintComponentName]
    if (components) {
      processObject(ctx.value)
    }
  }

}
