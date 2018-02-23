'use strict'

const yamlToJs = require('./utils/yaml-to-js')

class YamlToForm {
  generateForm (options, callback) {
    this.yaml = yamlToJs(options.yamlPath)

    const form = {
      jsonSchema: {
        schema: this.generateSchema(),
        validationSchema: {},
        conditionalSchema: this.generateConditionalSchema()
      }
    }

    form.jsonSchema.uiSchema = this.generateUiSchema(form.jsonSchema.schema.properties)
    callback(null, form)
  }

  generateUiSchema (schemaProps) {
    const uiSchema = {}

    Object.keys(schemaProps).map(section => {
      uiSchema[section] = {'ui:section': true}
      const s = schemaProps[section]
      Object.keys(s.properties).map(prop => {
        const p = s.properties[prop]
        uiSchema[section][prop] = {
          'ui:section:field': p.title,
          'ui:widget': this.schemaTypeToWidgetAndField(p)[0],
          'ui:field': this.schemaTypeToWidgetAndField(p)[1]
        }

        if (uiSchema[section][prop]['ui:field'] === 'ArrayField') {
          uiSchema[section][prop].items = p.enum.map(() => {
            return {
              'ui:widget': 'checkField',
              'ui:options': {removable: false}
            }
          })
        }

        if (p.description) uiSchema[section][prop]['ui:help'] = p.description
      })
    })

    return uiSchema
  }

  // Number could also be selectField/radioField/questionnaire? Where to fit in questionnaire?
  schemaTypeToWidgetAndField (schema) {
    let widget, field
    switch (schema.type) {
      case 'string':
        widget = 'textField'
        field = 'StandardField'
        if (schema.format === 'date-time') widget = 'dateField'
        if (schema.format === 'address') widget = 'addressField'
        if (schema.enum && schema.enum.length > 4) widget = 'selectField'
        if (schema.enum && schema.enum.length <= 4) widget = 'radioField'
        break
      case 'number':
        widget = 'numberField'
        field = 'StandardField'
        break
      case 'integer':
        widget = 'numberField'
        field = 'StandardField'
        break
      case 'boolean':
        widget = 'switchField'
        field = 'StandardField'
        break
      case 'array':
        if (schema.enum && schema.enum.length > 4) {
          widget = 'checkField'
          field = 'ArrayField'
        }
        if (schema.format === 'file') {
          widget = 'fileUploader'
          field = 'StandardField' // Shouldn't this be an ArrayField if type is array?
        }
    }
    return [widget, field]
  }

  generateSchema () {
    return {
      formtitle: this.yaml.form.title,
      formdescription: this.yaml.form.header.description,
      formimage: this.yaml.form.header.image,
      formcolorscheme: this.yaml.form.colorScheme,
      type: 'object',
      properties: this.generateSchemaProperties()
    }
  }

  generateConditionalSchema () {
    const schema = {}
    Object.keys(this.yaml.sections).map(section => {
      this.yaml.sections[section].widgets.map(widget => {
        if (widget.condition) {
          schema[section + '_' + widget.title] = {
            expression: widget.condition.expression,
            dependents: widget.condition.dependents
          }
        }
      })
    })
    return schema
  }

  generateSchemaProperties () {
    const props = {}
    Object.keys(this.yaml.sections).map(section => {
      const s = this.yaml.sections[section]
      props[section] = {
        type: 'object',
        title: s.title,
        description: s.description,
        required: [],
        properties: {}
      }
      s.widgets.map(widget => {
        if (widget.title) {
          if (widget.title.slice(-1) === '*') {
            widget.title = widget.title.slice(0, -1)
            props[section].required.push(widget.title)
          }
        }

        props[section].properties[widget.title] = {
          type: widget.type,
          title: widget.description
        }

        if (widget.enums) {
          props[section].properties[widget.title].enum = []
          props[section].properties[widget.title].enumNames = []

          widget.enums.map(val => {
            props[section].properties[widget.title].enum.push(val.split('|')[0])
            props[section].properties[widget.title].enumNames.push(val.split('|')[1])
          })
        }

        if (widget.format) props[section].properties[widget.title].format = widget.format
        if (widget.help) props[section].properties[widget.title].description = widget.help
        if (widget.default) props[section].properties[widget.title].default = widget.default
      })
    })
    return props
  }
}

module.exports = YamlToForm
