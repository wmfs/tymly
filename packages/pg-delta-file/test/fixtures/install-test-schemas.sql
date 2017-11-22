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

CREATE TABLE springfield.homes (
  id integer NOT NULL,
  address text,
  owner_id integer NOT NULL,
  _created timestamp with time zone,
  _modified timestamp with time zone,
  CONSTRAINT homes_pkey PRIMARY KEY (id),
  CONSTRAINT homes_to_people_fk FOREIGN KEY (owner_id)
   REFERENCES springfield.people (social_security_id) MATCH SIMPLE
   ON UPDATE NO ACTION ON DELETE CASCADE
);

INSERT INTO springfield.homes (id, address, owner_id, _created, _modified) VALUES
(1, '1 Evergreen Terrace', 1, '2017-06-02 15:00:01.000000 GMT', '2017-06-02 17:00:01.000000 GMT'),
(2, 'Springfield Nuclear Powerplant', 5, '2017-06-02 15:00:01.000000 GMT', '2017-06-02 16:00:01.000000 GMT'),
(3, '2 Evergreen Terrace', 6, '2017-06-02 15:00:01.000000 GMT', '2017-06-02 15:20:01.000000 GMT');