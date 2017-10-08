module.exports = function shortenPluginName (pluginName) {
  let shortened
  if (pluginName.slice(0, 6) === 'tymly-' && pluginName.slice(-7) === '-plugin') {
    shortened = pluginName.slice(6)
    shortened = shortened.slice(0, shortened.length - 7)
  } else {
    shortened = pluginName
  }

  return shortened
}
