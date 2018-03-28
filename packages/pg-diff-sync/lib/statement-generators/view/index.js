function viewStatementGenerator (viewId, view, statements) {
  if ((!view.base) || (view.base.sql !== view.target.sql)) {
    statements.push(`CREATE OR REPLACE VIEW ${viewId} AS ${view.target.sql}`)
  }
}

module.exports = viewStatementGenerator
