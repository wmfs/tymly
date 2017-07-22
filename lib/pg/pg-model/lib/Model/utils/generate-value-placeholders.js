module.exports = function valuePlaceholders (l) {
  const parts = []
  for (let i = 1; i <= l; i++) {
    parts.push('$' + i)
  }
  return parts.join(',')
}
