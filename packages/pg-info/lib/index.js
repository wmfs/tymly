const _ = require('lodash')

const FK_ACTION_CODES = require('./fk-action-codes.json')
const FK_MATCH_TYPES = require('./fk-match-types.json')
const QUERIES = require('./queries')

async function pgInfo (options) {
  // //////////////
  const schemas = options.schemas || ['public']
  const client = options.client

  const queries = QUERIES().map(query => client.query(query, [schemas]).then(result => result.rows))
  const queryResults = await Promise.all(queries)

  const info = {
    generated: new Date().toISOString(),
    schemas: {}
  }

  const pgSchemas = queryResults[0]
  const pgTables = queryResults[1]
  const pgColumns = queryResults[2]
  const pgPkColumns = queryResults[3]
  const pgIndexes = queryResults[4]
  const pgFkConstraints = queryResults[5]
  const pgTriggers = queryResults[6]
  const pgFunctions = queryResults[7]
  // const pgViews = queryResults[8]

  // Loop over each requested schema namen
  for (const requestedSchemaName of schemas) {
    const candidatePgSchema = pgSchemas.find(s => s.schema_name === requestedSchemaName)

    if (!candidatePgSchema) {
      // Database doesn't have this schema name
      info.schemas[requestedSchemaName] = {
        schemaExistsInDatabase: false
      }
      continue
    }

    // Database has this schema name
    info.schemas[requestedSchemaName] = {
      schemaExistsInDatabase: true,
      comment: candidatePgSchema.schema_comment,
      tables: {}
    }

    const schemaTables = pgTables.filter(table => table.table_schema === requestedSchemaName)
    for (const candidatePgTable of schemaTables) {
      const pkColumnNames = pgPkColumns
        .filter(o => o.table_schema === requestedSchemaName && o.table_name === candidatePgTable.table_name)
        .map(col => col.pk_column_name)

      const columns = pgColumns
        .filter(o => o.table_schema === requestedSchemaName && o.table_name === candidatePgTable.table_name)
        .reduce((columns, col) => {
          const columnInfo = {
            columnDefault: col.column_default,
            isNullable: col.is_nullable,
            dataType: col.data_type,
            characterMaximumLength: col.character_maximum_length,
            numericScale: col.numeric_scale,
            comment: col.column_comment
          }
          if (columnInfo.dataType === 'ARRAY') {
            columnInfo.array = true
            columnInfo.dataType = col.array_element_type.slice(1)
          } else {
            columnInfo.array = false
          }
          columns[col.column_name] = columnInfo
          return columns
        },
        {}
        )

      const indexes = pgIndexes
        .filter(index => index.table_name === requestedSchemaName + '.' + candidatePgTable.table_name)
        .filter(index => !index.is_primary)
        .reduce((indexes, index) => {
            indexes[index.index_name] = {
              columns: [
                index.index_keys
              ],
              unique: index.is_unique,
              method: index.method
            }
            return indexes
          },
          {}
          )

      const triggers = {}
      const tableTriggers = _.filter(pgTriggers, {
        trigger_schema: requestedSchemaName,
        event_object_table: candidatePgTable.table_name
      })
      tableTriggers.forEach(
        function (tableTrigger) {
          triggers[tableTrigger.trigger_name] = {
            eventManipulation: tableTrigger.event_manipulation,
            actionCondition: tableTrigger.action_condition,
            actionStatement: tableTrigger.action_statement,
            actionOrientation: tableTrigger.action_orientation,
            actionTiming: tableTrigger.action_timing
          }
        }
      )

      const functions = {}
      const tableFunctions = _.filter(pgFunctions, {specific_schema: requestedSchemaName})
      tableFunctions.forEach(
        function (tableFunction) {
          functions[tableFunction.routine_name] = {
            dataType: tableFunction.data_type
          }
        }
      )

      const fkConstraints = {}
      const tableFkConstraints = _.filter(pgFkConstraints, {source_table: requestedSchemaName + '.' + candidatePgTable.table_name})
      tableFkConstraints.forEach(
        function (fkConstraint) {
          const fkName = fkConstraint.constraint_name
          if (!fkConstraints.hasOwnProperty(fkName)) {
            fkConstraints[fkName] = {
              targetTable: fkConstraint.target_table,
              sourceColumns: [fkConstraint.source_column],
              targetColumns: [fkConstraint.target_column],
              updateAction: FK_ACTION_CODES[fkConstraint.update_action],
              deleteAction: FK_ACTION_CODES[fkConstraint.delete_action],
              matchType: FK_MATCH_TYPES[fkConstraint.match_type]
            }
          } else {
            fkConstraints[fkName].sourceColumns.push(fkConstraint.source_column)
            fkConstraints[fkName].targetColumns.push(fkConstraint.target_column)
          }
        }
      )

      // This table is this schema
      const tables = info.schemas[requestedSchemaName].tables
      tables[candidatePgTable.table_name] = {
        comment: candidatePgTable.table_comment,
        pkColumnNames: pkColumnNames,
        columns: columns,
        indexes: indexes,
        triggers: triggers,
        functions: functions,
        fkConstraints: fkConstraints
      }
    }
  }

  return info
}

const NotSet = 'NotSet'

module.exports = (options, callback = NotSet) => {
  if (callback === NotSet) {
    return pgInfo(options)
  }

  pgInfo(options)
    .then(info => {
      try { callback(null, info) } catch (err) { callback(null) }
    })
    .catch(err => callback(err))
}
