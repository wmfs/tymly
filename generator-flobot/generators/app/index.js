'use strict'
const Generator = require('yeoman-generator')
const yosay = require('yosay')
const path = require('path')

// https://github.com/SBoudrias/mem-fs-editor
// http://ejs.co/
// https://github.com/SBoudrias/Inquirer.js

module.exports = class extends Generator {
  prompting () {
    this.log(yosay(
      'Welcome to flobot-generator!'
    ))
    return this.prompt(
      [
        {
          name: 'blueprintName',
          message: 'What is your blueprint\'s name?',
          default: 'blueprintName'
        },
        {
          name: 'blueprintNamespace',
          message: 'What is your blueprint\'s namespace?'
        },
        {
          name: 'flowName',
          message: 'What is the name of the flow?'
        },
        {
          name: 'flowDesc',
          message: 'Description for this flow:'
        },
        {
          name: 'flowStart',
          message: 'What is the initial state for this FSM?'
        },
        {
          name: 'modelName',
          message: 'What is the name of the model?'
        },
        {
          name: 'modelDesc',
          message: 'Description for this model:'
        }
      ]
    ).then(
      function (props) {
        this.log('in prompts')
        this.blueprintName = props.blueprintName
        this.blueprintNamespace = props.blueprintNamespace
        this.flowName = props.flowName
        this.flowDesc = props.flowDesc
        this.flowStart = props.flowStart
        this.modelName = props.modelName
        this.modelDesc = props.modelDesc
      }.bind(this))
  }

  copyNeededFiles () {
    const context = {
      blueprint_name: this.blueprintName,
      blueprint_namespace: this.blueprintNamespace,
      flow_name: this.flowName,
      flow_desc: this.flowDesc,
      flow_start: this.flowStart,
      model_name: this.modelName,
      model_desc: this.modelDesc
    }
    this.fs.copyTpl(path.resolve(__dirname, './templates/_blueprint.json'), 'blueprint.json', context)
    this.fs.copyTpl(path.resolve(__dirname, './templates/_flow.json'), 'flows/flow.json', context)
    this.fs.copyTpl(path.resolve(__dirname, './templates/_model.json'), 'models/model.json', context)
    this.fs.copy(path.resolve(__dirname, './templates/_README.md'), 'README.md', context)
    this.fs.copy(path.resolve(__dirname, './templates/_gitignore'), '.gitignore', context)
    this.fs.copy(path.resolve(__dirname, './templates/_LICENSE.md'), 'LICENSE.md', context)
  }
}
