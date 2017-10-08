const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const ejs = require('ejs')
const sprintf = require('sprintf').sprintf
const headerTemplate = fs.readFileSync(path.resolve(__dirname, './templates/component-header.ejs'))
const footerTemplate = fs.readFileSync(path.resolve(__dirname, './templates/component-footer.ejs'))
const shortenPluginName = require('./utils/shorten-plugin-name')
const contentProcessors = require('./content-processors')

const contentTemplates = {
  services: fs.readFileSync(path.resolve(__dirname, './templates/services-content.ejs')).toString(),
  commands: fs.readFileSync(path.resolve(__dirname, './templates/commands-content.ejs')).toString(),
  stateResources: fs.readFileSync(path.resolve(__dirname, './templates/state-resources-content.ejs')).toString()
}

module.exports = function docWriter (componentRootPath, componentTypeName, pluginInfo, componentId, componentTypeSingular, componentDescription, weight, component, inventory, callback) {
  function ensureEndingGrammar (text) {
    let op = text
    if (['.', '!'].indexOf(op.slice(-1)) === -1) {
      op += '.'
    }
    return op
  }

  function getPluginEnding () {
    let ending
    const componentsWithSameId = inventory[componentTypeName][componentId]
    if (componentsWithSameId.length === 1) {
      ending = " and isn't offered by any of the other core plugins.\n\n"
    } else {
      ending = ' - note that alternative `storage` ' + componentTypeName + ' are offered via the following plugins:\n\n'
      componentsWithSameId.forEach(
        function (component) {
          if (component.pluginId !== pluginInfo.pluginId) {
            const altPlugin = inventory.plugins[component.pluginId]

            ending += sprintf(
              '- [%s](/reference/%s/%s-%s)\n',
              shortenPluginName(altPlugin.package.pkg.name),
              componentTypeName,
              shortenPluginName(altPlugin.package.pkg.name),
              componentId
            )
          }
        }
      )

      ending += '\n'
    }

    return ending
  }

  const filenameParts = []
  if (pluginInfo) {
    filenameParts.push(_.kebabCase(pluginInfo.label))
  }
  if (componentId) {
    filenameParts.push(_.kebabCase(componentId))
  }

  const filename = filenameParts.join('-') + '.md'

  const filePath = path.resolve(
    __dirname,
    path.join(
      './../../hugo-site/content/reference',
      _.kebabCase(componentTypeName),
      filename
    )
  )

  let ctx = {
    now: new Date().toISOString(),
    description: ensureEndingGrammar(componentDescription),
    pluginEnding: getPluginEnding(),
    componentId: componentId,
    componentRootPath: componentRootPath,
    componentTypeSingular: componentTypeSingular,
    pluginInfo: pluginInfo,
    componentDescription: componentDescription,
    weight: weight,
    doc: component.doc
  }

  const headerMd = ejs.render(
    headerTemplate.toString(),
    ctx
  )

  const footerMd = ejs.render(
    footerTemplate.toString(),
    ctx
  )

  ctx = _.defaults(ctx, component.componentModule)
  if (contentProcessors[componentTypeName]) {
    contentProcessors[componentTypeName](ctx, inventory, function (err) {
      if (err) {
        callback(err)
      } else {
        const contentMd = ejs.render(
          contentTemplates[componentTypeName],
          ctx
        )

        console.log('  Writing ' + filePath)

        fs.writeFileSync(filePath, headerMd + contentMd + footerMd)

        callback(null, filePath)
      }
    })
  } else {
    throw new Error(`No content processor for component type '${componentTypeName}'`)
  }
}
