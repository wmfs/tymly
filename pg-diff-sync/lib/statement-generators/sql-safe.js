module.exports = function sqlSafe (text) {
  if (text) {
    return text.replace(/'/g, "''")
  } else {
    return text
  }
}
