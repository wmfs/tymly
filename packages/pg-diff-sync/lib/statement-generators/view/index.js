function viewStatementGenerator(viewId, view, statements) {
  if (_.isUndefined(view.base)) {
    statements.push(`CREATE OR REPLACE VIEW ${viewId} AS ${view.sql};`)
  }
}

module.exports = viewStatementGenerator
