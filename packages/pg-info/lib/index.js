'use strict'

const async = require('async')
const _ = require('lodash')

const FK_ACTION_CODES = {
  a: 'NO ACTION',
  r: 'RESTRICT',
  c: 'CASCADE',
  n: 'SET NULL',
  d: 'SET DEFAULT'
}

const FK_MATCH_TYPES = {
  f: 'FULL',
  p: 'PARTIAL',
  s: 'SIMPLE'
}

const QUERIES = [

   // List of schemas
  'select nspname as schema_name, obj_description(oid) as schema_comment ' +
  'from pg_namespace ' +
  'where nspname = ANY($1)',

  // List of tables
  "select table_schema, table_name, obj_description((table_schema||'.'||table_name)::regclass, 'pg_class') table_comment " +
  'from information_schema.tables ' +
  'where table_schema = ANY($1)',

  // List of columns
  'select table_schema, table_name, column_name, column_default, is_nullable, data_type, character_maximum_length, numeric_scale, ' +
  "pg_catalog.col_description(format('%s.%s',isc.table_schema,isc.table_name)::regclass::oid,isc.ordinal_position) as column_comment, udt_name as array_element_type " +
  'from information_schema.columns isc ' +
  'where table_schema = ANY($1) ' +
  'order by ordinal_position',

  // List of primary keys
  'select a.attname pk_column_name, t.table_schema, t.table_name ' +
  'from information_schema.tables t, pg_index i ' +
  'join pg_attribute a on a.attrelid = i.indrelid ' +
  'and a.attnum = any(i.indkey) ' +
  "where i.indrelid = (t.table_schema||'.'||t.table_name)::regclass " +
  'and i.indisprimary ' +
  'and t.table_schema = any($1)',

  // List of indexes
  'SELECT ' +
  'ns.nspname               AS schema_name, ' +
  'idx.indrelid :: REGCLASS AS table_name, ' +
  'i.relname                AS index_name, ' +
  'idx.indisunique          AS is_unique, ' +
  'idx.indisprimary         AS is_primary, ' +
  'am.amname                AS method, ' +
  'ARRAY( ' +
  'SELECT pg_get_indexdef(idx.indexrelid, k + 1, TRUE) ' +
  'FROM ' +
  'generate_subscripts(idx.indkey, 1) AS k ' +
  'ORDER BY k ' +
  ') AS index_keys ' +
  'FROM pg_index AS idx ' +
  'JOIN pg_class AS i ' +
  'ON i.oid = idx.indexrelid ' +
  'JOIN pg_am AS am ' +
  'ON i.relam = am.oid ' +
  'JOIN pg_namespace AS NS ON i.relnamespace = NS.OID ' +
  'JOIN pg_user AS U ON i.relowner = U.usesysid ' +
  'WHERE ns.nspname = ANY($1)',

  // List of foreign key constraints
  "SELECT constraint_name,split_part(source_table, '.', 1) AS source_schema, source_table, source_column, target_table, target_column, update_action, delete_action, match_type FROM " +
  '(SELECT constraint_name,source_table::regclass::text AS source_table, source_attr.attname AS source_column, ' +
  'target_table::regclass::text, target_attr.attname AS target_column, update_action, delete_action, match_type ' +
  'FROM pg_attribute target_attr, pg_attribute source_attr, ' +
  '(SELECT constraint_name, source_table, target_table, source_constraints[i] source_constraints, target_constraints[i] AS target_constraints,  update_action, delete_action, match_type ' +
  ' FROM ' +
  ' (SELECT conname AS constraint_name, conrelid as source_table, confrelid AS target_table, conkey AS source_constraints, confkey AS target_constraints, ' +
  ' generate_series(1, array_upper(conkey, 1)) AS i, confupdtype as update_action, confdeltype as delete_action, confmatchtype as match_type ' +
  ' FROM pg_constraint ' +
  " WHERE contype = 'f' " +
  ')  query1 ' +
  ') query2 ' +
  'WHERE target_attr.attnum = target_constraints AND target_attr.attrelid = target_table ' +
  'AND source_attr.attnum = source_constraints AND source_attr.attrelid = source_table) AS fk_constraints ' +
  "WHERE split_part(source_table, '.', 1) = ANY($1)"
]

module.exports = function pgInfo (options, callback) {
  // Options
  // -------
  // client         Connects pg instance (client or pool is fine)
  // schemas        List of schemas to info

  const schemas = options.schemas || ['public']
  const client = options.client
  const queryResults = []

  async.eachSeries(
    QUERIES,
    function (query, cb) {
      client.query(query, [schemas], function (err, result) {
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
