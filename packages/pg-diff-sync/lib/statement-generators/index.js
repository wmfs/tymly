module.exports = {
  column: require('./column/index'),
  columnComment: require('./column-comment/index'),
  pkColumnNames: require('./pk-column-names/index'),
  schema: require('./schema/index'),
  schemaComment: require('./schema-comment/index'),
  table: require('./table/index'),
  index: require('./index-gen/index'),
  tableComment: require('./table-comment/index'),
  fkConstraint: require('./fk-constraint/index'),
  view: require('./view/index')
}
