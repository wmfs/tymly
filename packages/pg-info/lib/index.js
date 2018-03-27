
const FK_ACTION_CODES = require('./fk-action-codes.json')
const FK_MATCH_TYPES = require('./fk-match-types.json')
const QUERIES = require('./queries')

function findPrimaryKeyColumns (pgPkColumns, schemaName, tableName) {
  return pgPkColumns
    .filter(o => o.table_schema === schemaName && o.table_name === tableName)
    .map(col => col.pk_column_name)
} // primaryKeyColumns

function findColumns (pgColumns, schemaName, tableName) {
  return pgColumns
    .filter(o => o.table_schema === schemaName && o.table_name === tableName)
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
} // findColumns

function findIndexes (pgIndexes, schemaName, tableName) {
  return pgIndexes
    .filter(index => index.table_name === `${schemaName}.${tableName}`)
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
} // findIndexes

function findTriggers (pgTriggers, schemaName, tableName) {
  return pgTriggers
    .filter(t => t.trigger_schema === schemaName && t.event_object_table === tableName)
    .reduce((triggers, trigger) => {
      triggers[trigger.trigger_name] = {
        eventManipulation: trigger.event_manipulation,
        actionCondition: trigger.action_condition,
        actionStatement: trigger.action_statement,
        actionOrientation: trigger.action_orientation,
        actionTiming: trigger.action_timing
      }
      return triggers
    },
    {}
    )
} // findTriggers

function findFunctions (pgFunctions, schemaName, tableName) {
  return pgFunctions
    .filter(f => f.specific_schema === schemaName)
    .reduce((functions, func) => {
      functions[func.routine_name] = {
        dataType: func.data_type
      }
      return functions
    },
    {}
    )
} // findFunctions

function findConstraints (pgFkConstraints, schemaName, tableName) {
  return pgFkConstraints
    .filter(fk => fk.source_table === `${schemaName}.${tableName}`)
    .reduce((fkConstraints, constraint) => {
      const fkName = constraint.constraint_name
      if (!fkConstraints.hasOwnProperty(fkName)) {
        fkConstraints[fkName] = {
          targetTable: constraint.target_table,
          sourceColumns: [constraint.source_column],
          targetColumns: [constraint.target_column],
          updateAction: FK_ACTION_CODES[constraint.update_action],
          deleteAction: FK_ACTION_CODES[constraint.delete_action],
          matchType: FK_MATCH_TYPES[constraint.match_type]
        }
      } else {
        fkConstraints[fkName].sourceColumns.push(constraint.source_column)
        fkConstraints[fkName].targetColumns.push(constraint.target_column)
      }
      return fkConstraints
    },
    {}
    )
} // findConstraints

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
  for (const schemaName of schemas) {
    const schema = pgSchemas.find(s => s.schema_name === schemaName)

    if (!schema) {
      // Database doesn't have this schema name
      info.schemas[schemaName] = {
        schemaExistsInDatabase: false
      }
      continue
    }

    // Database has this schema name
    info.schemas[schemaName] = {
      schemaExistsInDatabase: true,
      comment: schema.schema_comment,
      tables: {}
    }

    const schemaTables = pgTables.filter(table => table.table_schema === schemaName)
    for (const table of schemaTables) {
      const tableName = table.table_name

      info.schemas[schemaName].tables[tableName] = {
        comment: table.table_comment,
        pkColumnNames: findPrimaryKeyColumns(pgPkColumns, schemaName, tableName),
        columns: findColumns(pgColumns, schemaName, tableName),
        indexes: findIndexes(pgIndexes, schemaName, tableName),
        triggers: findTriggers(pgTriggers, schemaName, tableName),
        functions: findFunctions(pgFunctions, schemaName, tableName),
        fkConstraints: findConstraints(pgFkConstraints, schemaName, tableName)
      }
    } // tables ...
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
