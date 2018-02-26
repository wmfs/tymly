/* eslint-env mocha */

const expect = require('chai').expect
const path = require('path')
const yamlToJs = require('../lib/utils/yaml-to-js')
const YamlToFormAndStateMachine = require('../lib')

describe('Run the form-maker tests', function () {
  const options = {
    namespace: 'test',
    formName: 'people',
    modelName: 'people',
    yamlPath: path.resolve(__dirname, 'fixtures', 'people-blueprint', 'people.yml')
  }

  it('should convert the yaml file to json', (done) => {
    const obj = yamlToJs(path.resolve(__dirname, 'fixtures', 'people-blueprint', options.formName + '.yml'))
    expect(obj.form.name).to.eql('people')
    expect(obj.form.title).to.eql('People')
    expect(obj.model.jsonSchemaPaths).to.eql('./models/people.json')
    done()
  })

  it('should do both conversions in one', (done) => {
    YamlToFormAndStateMachine(options, (err, result) => {
      expect(err).to.eql(null)

      expect(result.form.jsonSchema.schema.formtitle).to.eql('People')
      expect(result.form.jsonSchema.schema.properties.general.properties.firstName.type).to.eql('string')
      expect(result.form.jsonSchema.schema.properties.general.properties.firstName.title).to.eql('First name.')
      expect(result.form.jsonSchema.schema.properties.general.properties.dateOfBirth.format).to.eql('date-time')
      expect(result.form.jsonSchema.schema.properties.general.properties.homeAddress.format).to.eql('address')
      expect(result.form.jsonSchema.schema.properties.general.properties.avatar.format).to.eql('file')
      expect(result.form.jsonSchema.schema.properties.general.properties.favouriteColour.enum[0]).to.eql('BLUE')
      expect(result.form.jsonSchema.schema.properties.general.properties.favouriteColour.enumNames[0]).to.eql('Blue')
      expect(result.form.jsonSchema.schema.properties.general.required).to.eql(['firstName', 'lastName'])
      expect(result.form.jsonSchema.conditionalSchema.general_firstName.expression).to.eql('(general_firstName)')
      expect(result.form.jsonSchema.conditionalSchema.general_firstName.dependents).to.eql(['general_lastName'])

      expect(result.stateMachine.Comment).to.eql('A bunch of people.')
      expect(result.stateMachine.categories).to.eql(['people'])

      expect(result.model.title).to.eql('People')
      expect(result.model.properties.firstName.type).to.eql('string')
      expect(result.model.properties.firstName.description).to.eql('First name.')

      done(err)
    })
  })
})
