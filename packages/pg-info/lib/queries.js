'use strict'

module.exports = function queries () {
  return [
    // List of schemas
    'select nspname as schema_name, obj_description(oid) as schema_comment ' +
    'from pg_namespace ' +
    'where nspname = ANY($1)',

    // List of tables
    'select table_schema, table_name, obj_description((table_schema||\'.\'||table_name)::regclass, \'pg_class\') table_comment ' +
    'from information_schema.tables ' +
    'where table_schema = ANY($1)',

    // List of columns
    'select table_schema, table_name, column_name, column_default, is_nullable, data_type, character_maximum_length, numeric_scale, ' +
    'pg_catalog.col_description(format(\'%s.%s\',isc.table_schema,isc.table_name)::regclass::oid,isc.ordinal_position) as column_comment, udt_name as array_element_type ' +
    'from information_schema.columns isc ' +
    'where table_schema = ANY($1) ' +
    'order by ordinal_position',

    // List of primary keys
    'select a.attname pk_column_name, t.table_schema, t.table_name ' +
    'from information_schema.tables t, pg_index i ' +
    'join pg_attribute a on a.attrelid = i.indrelid ' +
    'and a.attnum = any(i.indkey) ' +
    'where i.indrelid = (t.table_schema||\'.\'||t.table_name)::regclass ' +
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
    'SELECT constraint_name,split_part(source_table, \'.\', 1) AS source_schema, source_table, source_column, target_table, target_column, update_action, delete_action, match_type FROM ' +
    '(SELECT constraint_name,source_table::regclass::text AS source_table, source_attr.attname AS source_column, ' +
    'target_table::regclass::text, target_attr.attname AS target_column, update_action, delete_action, match_type ' +
    'FROM pg_attribute target_attr, pg_attribute source_attr, ' +
    '(SELECT constraint_name, source_table, target_table, source_constraints[i] source_constraints, target_constraints[i] AS target_constraints,  update_action, delete_action, match_type ' +
    ' FROM ' +
    ' (SELECT conname AS constraint_name, conrelid as source_table, confrelid AS target_table, conkey AS source_constraints, confkey AS target_constraints, ' +
    ' generate_series(1, array_upper(conkey, 1)) AS i, confupdtype as update_action, confdeltype as delete_action, confmatchtype as match_type ' +
    ' FROM pg_constraint ' +
    ' WHERE contype = \'f\' ' +
    ')  query1 ' +
    ') query2 ' +
    'WHERE target_attr.attnum = target_constraints AND target_attr.attrelid = target_table ' +
    'AND source_attr.attnum = source_constraints AND source_attr.attrelid = source_table) AS fk_constraints ' +
    'WHERE split_part(source_table, \'.\', 1) = ANY($1)',

    // List of triggers
    'SELECT trigger_name, trigger_schema, event_object_schema, event_object_table, event_manipulation, action_condition, action_statement, action_orientation, action_timing ' +
    'FROM information_schema.triggers ' +
    'WHERE trigger_schema = ANY($1)',

    // List of functions
    'SELECT * ' +
    'FROM information_schema.routines ' +
    'WHERE specific_schema = ANY($1)'
  ]
}
