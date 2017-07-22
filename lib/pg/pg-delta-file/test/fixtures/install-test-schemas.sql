DROP SCHEMA IF EXISTS springfield CASCADE;

CREATE SCHEMA springfield;

CREATE TABLE springfield.people (
  hash_sum text NOT NULL,
  social_security_id integer NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  age integer,
  _created timestamp with time zone,
  _modified timestamp with time zone,
  CONSTRAINT springfield_people_pkey PRIMARY KEY (social_security_id)
);

INSERT INTO springfield.people (hash_sum, social_security_id, first_name, last_name, age, _created, _modified) VALUES
('AAAAAAAA', 1, 'Homer', 'Simpson', 39, '2017-06-02 15:00:01.000000 GMT', '2017-06-02 15:02:37.000000 GMT'),
('BBBBBBBB', 2, 'Marge', 'Simpson', 36, '2017-06-02 15:00:01.000000 GMT', '2017-06-02 15:02:38.000000 GMT'),
('EEEEEEEE', 5, 'Montgomery', 'Burns', 123, '2017-06-02 15:00:01.000000 GMT', '2017-06-02 15:02:39.000000 GMT'),
('11111111', 6, 'Ned', 'Flanders', 60, '2017-06-02 15:00:01.000000 GMT', '2017-06-02 15:02:40.000000 GMT'),
('22222222', 8, 'Bart', 'Simpson', 10, '2017-06-02 15:00:01.000000 GMT', '2017-06-02 18:42:12.000000 BST');
