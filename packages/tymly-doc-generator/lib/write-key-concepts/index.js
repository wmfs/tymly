const fs = require('fs')
const path = require('upath')
const ejs = require('ejs')
const shortenPluginName = require('./../write-reference/utils/shorten-plugin-name')

const keyConceptsTemplate = fs.readFileSync(path.resolve(__dirname, './templates/key-concepts.ejs'))

module.exports = function (rootDir, inventory) {
  const ctx = {
    blueprintDirs: [],
    pluginList: []
  }

  for (let pluginId in inventory.plugins) {
    if (inventory.plugins.hasOwnProperty(pluginId)) {
      const plugin = inventory.plugins[pluginId]
      ctx.pluginList.push(
        {
          label: shortenPluginName(plugin.package.pkg.name),
          description: plugin.meta.description || plugin.package.pkg.description,
          url: `/plugins/${plugin.package.pkg.name}`
        }
      )
    }
  }

  const services = inventory.services
  let service
  let blueprintDirs
  let description
  for (let serviceName in services) {
    if (services.hasOwnProperty(serviceName)) {
      service = services[serviceName][0]
      blueprintDirs = service.doc.blueprintDirs
      if (blueprintDirs) {
        for (let dirName in blueprintDirs) {
          if (blueprintDirs.hasOwnProperty(dirName)) {
            description = blueprintDirs[dirName]
            ctx.blueprintDirs.push(
              {
                dirName: '/' + dirName,
                description: description,
                service: serviceName
              }
            )
          }
        }
      }
    }
  }

  const md = ejs.render(
    keyConceptsTemplate.toString(),
    ctx
  )

  const destination = path.resolve(__dirname, './../../hugo-site/content/key-concepts/index.md')
  console.log('Writing ' + destination)
  fs.writeFileSync(destination, md)
}
