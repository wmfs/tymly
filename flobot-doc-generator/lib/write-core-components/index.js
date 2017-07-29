const _ = require('lodash')
const ejs = require('ejs')
const fs = require('fs')
const path = require('upath')
const docWriter = require('./doc-writer')
const shortenPluginName = require('./utils/shorten-plugin-name')
const template = fs.readFileSync(path.resolve(__dirname, './templates/reference.ejs'))
const async = require('async')

module.exports = function (rootDir, inventory, callback) {
  function getPluginInfoFromComponentPath (componentPath) {
    const pluginId = path.resolve(componentPath, './../..')
    const plugin = inventory.plugins[pluginId]
    return {
      pluginId: pluginId,
      label: shortenPluginName(plugin.package.pkg.name),
      description: plugin.meta.description || plugin.package.pkg.description,
      url: plugin.package.pkg.homepage
    }
  }

  function processComponent (componentTypeName, componentTypeSingular, weight, callback) {
    ctx[componentTypeName] = []
    let keys
    let pluginInfo
    const components = inventory[componentTypeName]
    let componentList
    keys = _.keys(components).sort()

    async.eachSeries(
      keys,
      function (componentName, cb) {
        componentList = components[componentName]

        async.eachSeries(
          componentList,

          function (component, cb2) {
            const description = component.componentModule.doc.description || '__No description!__'
            pluginInfo = getPluginInfoFromComponentPath(component.rootDirPath)

            docWriter(
              component.rootDirPath,
              componentTypeName,
              pluginInfo,
              componentName,
              componentTypeSingular,
              description,
              weight,
              component,
              inventory,
              function (err, docPath) {
                if (err) {
                  cb2(err)
                } else {
                  ctx[componentTypeName].push(
                    {
                      name: componentName,
                      description: description,
                      plugin: pluginInfo,
                      target: componentTypeName + '/' + _.kebabCase(pluginInfo.label) + '-' + _.kebabCase(componentName)
                    }
                  )
                  cb2(null)
                }
              }
            )
          },

          function (err) {
            if (err) {
              cb(err)
            } else {
              cb(null)
            }
          }
        )
      },
      callback
    )
  }

  const ctx = {
    now: new Date().toISOString(),
    pluginList: []
  }

  let plugin
  for (let pluginId in inventory.plugins) {
    if (inventory.plugins.hasOwnProperty(pluginId)) {
      plugin = inventory.plugins[pluginId]
      ctx.pluginList.push(
        {
          label: shortenPluginName(plugin.package.pkg.name),
          description: plugin.meta.description || plugin.package.pkg.description,
          url: plugin.package.pkg.homepage
        }
      )
    }
  }

  const components = [
    {componentName: 'states', singular: 'state', weight: 1000},
    {componentName: 'commands', singular: 'command', weight: 1010},
    {componentName: 'services', singular: 'service', weight: 1020}
  ]

  async.forEachSeries(
    components,
    function (comp, cb) {
      processComponent(
        comp.componentName,
        comp.singular,
        comp.weight,
        cb
      )
    },
    function (err) {
      if (err) {
        callback(err)
      } else {
        const md = ejs.render(
          template.toString(),
          ctx
        )

        const destination = path.resolve(__dirname, './../../hugo-site/content/reference/index.md')
        console.log('Writing ' + destination)

        fs.writeFileSync(destination, md)

        callback(null)
      }
    }
  )
}
