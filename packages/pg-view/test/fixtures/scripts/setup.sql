CREATE SCHEMA IF NOT EXISTS view_test;

DROP TABLE IF EXISTS view_test.address;
DROP TABLE IF EXISTS view_test.people;

CREATE TABLE view_test.address (
    id integer NOT NULL,
    building text,
    street text,
    town text
);

CREATE TABLE view_test.people (
    name text,
    address_id integer
);

INSERT INTO view_test.address VALUES (1, 'Headquarters', '99 Vauxhall Road', 'Birmingham');
INSERT INTO view_test.address VALUES (2, 'The Fire Station', 'The Street', 'Pontypandy');

INSERT INTO view_test.people VALUES ('Chief Fire Officer', 1);
INSERT INTO view_test.people VALUES ('Fireman Sam', 2);
INSERT INTO view_test.people VALUES ('Deputy Chief Fire Officer', 1);
