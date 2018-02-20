
function simplify(value) {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return simplifyArray(value)

  const keys = Object.keys(value)
  if (keys.length === 1 && keys[0] === '#text') return value['#text']
  return simplifyJson(value)
} // simplify

function simplifyArray(array) {
  return array.map(v => simplify(v))
} // simplifyArray

function simplifyJson(xml2json) {
  const result = { }

  for (const key of Object.keys(xml2json)) {
    const value = xml2json[key]
    const simplifiedValue = simplify(value)
    result[key] = simplifiedValue
  } // for

  return result
} // simplifyJson

module.exports = simplifyJson
