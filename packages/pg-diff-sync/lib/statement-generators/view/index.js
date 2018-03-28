function viewStatementGenerator (viewId, view, statements) {
  if (!view.base) {
    statements.push(`CREATE OR REPLACE VIEW ${viewId} AS ${view.target.sql}`)
  }
}

module.exports = viewStatementGenerator
