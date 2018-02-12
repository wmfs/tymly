'use strict'

const async = require('async')
const _ = require('lodash')

const FK_ACTION_CODES = require('./fk-action-codes.json')
const FK_MATCH_TYPES = require('./fk-match-types.json')
const QUERIES = require('./queries')

const NotSet = 'NotSet'

module.exports = function pgInfo (options, callback = NotSet) {
  // Options
  // -------
  // client         Connects pg instance (client or pool is fine)
  // schemas        List of schemas to info

  if (callback === NotSet) {
    return new Promise((resolve, reject) => {
      pgInfo(options, (err, info) => {
        if (err) {
          return reject(err)
        }
        resolve(info)
      })
    })
  } // if (callback === NotSet)

  // //////////////
  const schemas = options.schemas || ['public']
  const client = options.client
  const queryResults = []

  async.eachSeries(
    QUERIES(),
    function (query, cb) {
      client.query(
        query,
        [schemas],
        function (err, result) {
          if (err) {
            cb(err)
          } else {
            queryResults.push(result.rows)
            cb(null)
          }
        }
      )
    },
    function (err) {
      if (err) {
        callback(err)
      } else {
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

        // Loop over each requested schema name
        schemas.forEach(
          function (requestedSchemaName) {
            pgSchemas.forEach(
              function (candidatePgSchema) {
                if (candidatePgSchema.schema_name === requestedSchemaName) {
                  // Database has this schema name
                  info.schemas[requestedSchemaName] = {
                    schemaExistsInDatabase: true,
                    comment: candidatePgSchema.schema_comment,
                    tables: {}
                  }

                  pgTables.forEach(
                    function (candidatePgTable) {
                      if (candidatePgTable.table_schema === requestedSchemaName) {
                        const pkColumnNames = []
                        pgPkColumns.forEach(
                          function (candidatePkColumn) {
                            if (candidatePkColumn.table_schema === requestedSchemaName && candidatePkColumn.table_name === candidatePgTable.table_name) {
                              pkColumnNames.push(candidatePkColumn.pk_column_name)
                            }
                          }
                        )

                        const columns = {}
                        pgColumns.forEach(
                          function (candidateColumn) {
                            if (candidateColumn.table_schema === requestedSchemaName && candidateColumn.table_name === candidatePgTable.table_name) {
                              const columnInfo = {
                                columnDefault: candidateColumn.column_default,
                                isNullable: candidateColumn.is_nullable,
                                dataType: candidateColumn.data_type,
                                characterMaximumLength: candidateColumn.character_maximum_length,
                                numericScale: candidateColumn.numeric_scale,
                                comment: candidateColumn.column_comment
                              }
                              if (columnInfo.dataType === 'ARRAY') {
                                columnInfo.array = true
                                columnInfo.dataType = candidateColumn.array_element_type.slice(1)
                              } else {
                                columnInfo.array = false
                              }
                              columns[candidateColumn.column_name] = columnInfo
                            }
                          }
                        )

                        const indexes = {}
                        const tableIndexes = _.filter(pgIndexes, {table_name: requestedSchemaName + '.' + candidatePgTable.table_name})
                        tableIndexes.forEach(
                          function (tableIndex) {
                            if (!tableIndex.is_primary) {
                              indexes[tableIndex.index_name] = {
                                columns: [
                                  tableIndex.index_keys
                                ],
                                unique: tableIndex.is_unique,
                                method: tableIndex.method
                              }
                            }
                          }
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
                  )
                }
              }
            )
            if (!info.schemas.hasOwnProperty(requestedSchemaName)) {
              // Database doesn't have this schema name
              info.schemas[requestedSchemaName] = {
                schemaExistsInDatabase: false
              }
            }
          }
        )
        callback(null, info)
      }
    }
  )
}
