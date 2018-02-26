'use strict'

const yamlToJs = require('./utils/yaml-to-js.js')

class YamlToModel {
  generateModel (options, callback) {
    const yaml = yamlToJs(options.yamlPath)

    const generatedProps = this.generateProperties(yaml.sections)

    const model = {
      title: yaml.form.title,
      description: yaml.form.header.description,
      type: 'object',
      properties: generatedProps.properties,
      required: generatedProps.required
    }

    callback(null, model)
  }

  generateProperties (sections) {
    const properties = {}
    const required = []
    Object.keys(sections).map(section => {
      const s = sections[section]
      s.widgets.map(widget => {
        if (widget.title.slice(-1) === '*') {
          widget.title = widget.title.slice(0, -1)
          required.push(widget.title)
        }
        properties[widget.title] = {
          type: widget.type,
          description: widget.description
        }

        if (widget.format) properties[widget.title].format = widget.format

        if (widget.enums) {
          properties[widget.title].type = 'array'
          properties[widget.title].items = {
            type: 'string'
          }
        }
      })
    })
    return {properties: properties, required: required}
  }
}

module.exports = YamlToModel
