CREATE OR REPLACE FUNCTION tymly.update_processor()
  RETURNS trigger AS
$BODY$
DECLARE
  model_name TEXT = TG_ARGV[0];
  primary_key_columns TEXT ARRAY = TG_ARGV[1];
  key_value_pair RECORD;
  old_json JSON;
  new_json JSON;
  diff JSONB = jsonb_object('{}');
  old_and_new JSONB;
  old_value TEXT;
  changed BOOLEAN = false;
BEGIN
  old_json = to_json(old);
  new_json = to_json(new);
  FOR key_value_pair IN SELECT * FROM json_each_text(new_json) LOOP
    IF key_value_pair.key NOT IN ('_created', '_modified') THEN
      old_value = json_extract_path_text(old_json, key_value_pair.key);
      IF old_value IS DISTINCT FROM key_value_pair.value THEN
        changed := true;
        old_and_new = jsonb_object('{}');
        old_and_new := old_and_new || jsonb_build_object('from', json_extract_path(old_json, key_value_pair.key));
        old_and_new := old_and_new || jsonb_build_object('to', json_extract_path(new_json, key_value_pair.key));
        diff := diff || jsonb_build_object(key_value_pair.key, old_and_new);
      END IF;
    END IF;
  END LOOP;
  IF changed THEN
    new._modified = now();
    INSERT INTO tymly.rewind (
      model_name,
      key_string,
      old_values,
      diff
    ) VALUES (
      model_name,
      'XXX',
      old_json,
      diff
    );
  END IF;
  RETURN new;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;