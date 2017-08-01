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
      'Welcome to FlobotJS plugin generator!'
    ))
    this.fs.mkdir(path.resolve(__dirname, '/lib/components/services'))
    this.fs.mkdir(path.resolve(__dirname, '/lib/components/states'))
    this.fs.copy(path.resolve(__dirname, './templates/_index,js'), 'index.js')
    this.fs.copy(path.resolve(__dirname, './templates/_README.md'), 'README.md')
    this.fs.copy(path.resolve(__dirname, './templates/_gitignore'), '.gitignore')
    this.fs.copy(path.resolve(__dirname, './templates/_LICENSE.md'), 'LICENSE.md')
  }
}
