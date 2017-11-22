const _ = require('lodash')
const DEFAULT_SCHEMA_NAME = 'public'
const precision = require('precision')

module.exports = function schemaFilesParser (schemaFiles) {
  function getIndexName (tableName, index) {
    return tableName + '_' + index.columns.sort().join('_') + '_idx'
  }

  function getFkConstraintName (tableName, fkConstraint) {
    return tableName + '_to_' + fkConstraint.targetTable.replace('.', '_') + '_fk'
  }

  function getTableObjects (tableName, content) {
    const tableObjects = {
      indexes: {},
      fkConstraints: {}
    }

    const indexes = content.indexes || []
    const fkConstraints = content.fkConstraints || []

    // Add indexes for meta columns
    indexes.push({columns: ['_created'], unique: false})
    indexes.push({columns: ['_created_by'], unique: false})
    indexes.push({columns: ['_modified'], unique: false})
    indexes.push({columns: ['_modified_by'], unique: false})

    // Turn index propertyIds to column names
    indexes.forEach(
      function (index) {
        index.columns = _.map(index.columns, function (propertyId) { return convertPropertyNameToColumnName(propertyId) })
        index.method = 'btree'
        const indexName = getIndexName(tableName, index)
        tableObjects.indexes[indexName] = index
      }
    )

    // Turn index propertyIds to column names and configure
    fkConstraints.forEach(
      function (fkConstraint) {
        fkConstraint.targetColumns = _.map(fkConstraint.targetColumns, function (propertyId) { return convertPropertyNameToColumnName(propertyId) })
        fkConstraint.sourceColumns = _.map(fkConstraint.sourceColumns, function (propertyId) { return convertPropertyNameToColumnName(propertyId) })
        fkConstraint.updateAction = 'NO ACTION'
        fkConstraint.deleteAction = 'CASCADE'
        fkConstraint.matchType = 'SIMPLE'
        const fkConstraintName = getFkConstraintName(tableName, fkConstraint)
        tableObjects.fkConstraints[fkConstraintName] = fkConstraint
      }
    )

    return tableObjects
  }

  function convertNamespaceToSchemaName (namespace) {
    let schemaName
    if (namespace) {
      schemaName = _.kebabCase(namespace).replace(/-/g, '_')
    } else {
      schemaName = DEFAULT_SCHEMA_NAME
    }
    return schemaName
  }

  function applyPropertyToColumn (column, property) {
    switch (property.type) {
      case 'string':

        if (property.hasOwnProperty('format')) {
          switch (property.format) {
            case 'date-time':
              column.dataType = 'timestamp with time zone'
              break
            case 'email':
              column.dataType = 'text'
              break
            case 'uri':
              column.dataType = 'text'
              break
          }
        } else {
          column.dataType = 'text'
        }
        break

      case 'integer':
        if (property.hasOwnProperty('maxLength') && property.maxLength > 9) {
          column.dataType = 'bigint'
        } else {
          column.dataType = 'integer'
        }
        column.numericScale = 0
        break

      case 'number':
        if (_.isNumber(property.multipleOf)) {
          column.numericScale = precision(property.multipleOf)
        } else {
          column.numericScale = 0
        }
        column.numericPrecision = property.maxLength
        column.dataType = 'numeric'
        break

      case 'boolean':
        column.dataType = 'boolean'
        break

      case 'uuid':
        column.dataType = 'uuid'
        break

      case 'object':
        column.dataType = 'jsonb'
        break
    }
  }

  function convertPropertyNameToColumnName (propertyName) {
    return _.kebabCase(propertyName).replace(/-/g, '_')
  }

  function addRootTableFromSchemaFile (schemaName, tables, schemaFile) {
    const content = schemaFile.content

    const tableName = _.kebabCase(content.id).replace(/-/g, '_')

    if (!tables.hasOwnProperty(tableName)) {
      const columns = {}

      if (!content.hasOwnProperty('primaryKey')) {
        // TODO: What if there's no primary key defined, but it does already use an ID column? Use that? Add a different named UUID column?
        content.properties.id = {
          'type': 'uuid',
          'description': 'Automatically added UUID-based primary key column',
          'columnDefault': 'uuid_generate_v1()'
        }

        if (!content.hasOwnProperty('required')) {
          content.required = ['id']
        } else {
          content.required.push('id')
        }
        content.primaryKey = ['id']
      }

      // Add attribute columns from properties
      let property
      let column
      for (let propertyId in content.properties) {
        if (content.properties.hasOwnProperty(propertyId)) {
          property = content.properties[propertyId]

          let requiresColumn = true
          column = {}

          if (property.type === 'array') {
            if (property.hasOwnProperty('items')) {
              if (property.items.type === 'object') {
                requiresColumn = false
                const targetPrimaryKey = content.primaryKey

                // Simulate the nested document coming from a file itself
                const subDocFile = _.cloneDeep(schemaFile)
                subDocFile.content = property.items
                subDocFile.content.id = propertyId
                const fkPropertyIds = []
                targetPrimaryKey.forEach(
                  function (targetPrimaryKeyPropertyId) {
                    const targetKeyProperty = content.properties[targetPrimaryKeyPropertyId]
                    const fkPropertyId = _.camelCase(content.id + '-' + targetPrimaryKeyPropertyId)

                    if (!subDocFile.content.properties.hasOwnProperty(fkPropertyId)) {
                      fkPropertyIds.push(fkPropertyId)
                      subDocFile.content.properties[fkPropertyId] = {
                        type: targetKeyProperty.type,
                        description: 'Auto-added foreign key for ' + content.id
                      }
                      if (targetKeyProperty.maxLength) subDocFile.content.properties[fkPropertyId].maxLength = targetKeyProperty.maxLength
                    }
                  }
                )

                if (!subDocFile.content.hasOwnProperty('indexes')) {
                  subDocFile.content.indexes = []
                }

                subDocFile.content.indexes.push(
                  {
                    columns: fkPropertyIds,
                    unique: false
                  }
                )

                if (!subDocFile.content.hasOwnProperty('fkConstraints')) {
                  subDocFile.content.fkConstraints = []
                }

                subDocFile.content.fkConstraints.push(
                  {
                    targetTable: schemaName + '.' + tableName,
                    targetColumns: targetPrimaryKey,
                    sourceColumns: fkPropertyIds
                  }
                )

                addRootTableFromSchemaFile(schemaName, tables, subDocFile)
              } else {
                column.array = true
                applyPropertyToColumn(column, property.items)
              }
            }
          } else {
            column.array = false
            applyPropertyToColumn(column, property)
          }

          if (requiresColumn) {
            // Derive nullable
            if ((content.hasOwnProperty('required') && content.required.indexOf(propertyId) !== -1) ||
              (content.hasOwnProperty('primaryKey') && content.primaryKey.indexOf(propertyId) !== -1)) {
              column.isNullable = 'NO'
            } else {
              column.isNullable = 'YES'
            }

            // Derive column comment from property description
            column.comment = property.description
            columns[convertPropertyNameToColumnName(propertyId)] = column
          }
        }
      }

      // TEMPORARY FIX
      // TODO: What if there's no primary key defined, but it does already use an ID column? Use that? Add a different named UUID column?
      if (columns.id && columns.id.dataType === 'uuid') {
        columns.id = {
          array: false,
          dataType: 'uuid',
          columnDefault: 'uuid_generate_v1()',
          isNullable: 'NO',
          comment: 'Automatically added UUID-based primary key column'
        }
      }

      // Add some meta columns

      columns._created = {
        array: false,
        dataType: 'timestamp with time zone',
        columnDefault: 'now()',
        isNullable: 'NO',
        comment: 'Timestamp for when this record was created'
      }

      columns._created_by = {
        array: false,
        dataType: 'text',
        isNullable: 'YES',
        comment: 'UserID that created this record (if known)'
      }

      columns._modified = {
        array: false,
        dataType: 'timestamp with time zone',
        columnDefault: 'now()',
        isNullable: 'NO',
        comment: 'Timestamp for when this record was last updated'
      }

      columns._modified_by = {
        array: false,
        dataType: 'text',
        isNullable: 'YES',
        comment: 'UserID that last modified this record (if known)'
      }

      // Add table
      let table = {
        comment: content.description || 'Auto-generated via Relationize.js!',
        pkColumnNames: _.map(content.primaryKey, function (propertyId) { return convertPropertyNameToColumnName(propertyId) }),
        columns: columns
      }

      table = _.defaults(table, getTableObjects(tableName, content))
      tables[tableName] = table
    } else {
      // TODO: Merge or something... first-wins at the moment.

      console.log(`Unhandled clash with table ${JSON.stringify(tableName)}`)
    }
  }

  const audit = {
    generated: new Date().toISOString(),
    source: {},
    schemas: {}
  }

  // Build a list of schemas
  schemaFiles.forEach(
    function (schemaFile) {
      const schemaName = convertNamespaceToSchemaName(schemaFile.namespace)
      if (!audit.schemas.hasOwnProperty(schemaName)) {
        audit.schemas[schemaName] = {
          comment: 'Schema auto-generated by Relationize.js!'
        }
      }
    }
  )

  audit.expectedDbSchemaNames = _.keys(audit.schemas)

  // Loop over all expected schemaNames
  audit.expectedDbSchemaNames.forEach(
    function (dbSchemaName) {
      const schema = audit.schemas[dbSchemaName]
      schema.tables = {}

      // Go through all files and add any tables for this schema
      schemaFiles.forEach(
        function (candidateSchemaFile) {
          const candidateSchemaName = convertNamespaceToSchemaName(candidateSchemaFile.namespace)
          if (candidateSchemaName === dbSchemaName) {
            addRootTableFromSchemaFile(candidateSchemaName, schema.tables, candidateSchemaFile)
          }
        }
      )
    }
  )

  return audit
}
