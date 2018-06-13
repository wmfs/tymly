CREATE SCHEMA IF NOT EXISTS test;
CREATE SCHEMA IF NOT EXISTS wmfs;

DROP VIEW IF EXISTS test.factory_scores;

DROP TABLE IF EXISTS test.food;
DROP TABLE IF EXISTS test.incidents;
DROP TABLE IF EXISTS test.heritage;
DROP TABLE IF EXISTS test.gazetteer;
DROP TABLE IF EXISTS test.ranking_uprns;

CREATE TABLE test.gazetteer (
 uprn bigint not null primary key,
 address_label text not null
);

CREATE TABLE test.ranking_uprns (
 uprn bigint not null primary key,
 ranking_name text not null,
 range text,
 distribution numeric,
 last_audit_date timestamp with time zone,
 last_enforcement_action text,
 fs_management text,
 growth_curve numeric
);

CREATE TABLE test.food (
 uprn bigint not null primary key,
 rating int
);

CREATE TABLE test.incidents (
 uprn bigint not null primary key,
 amount int
);

CREATE TABLE test.heritage (
 uprn bigint not null primary key
);

CREATE TABLE IF NOT EXISTS wmfs.building (
 uprn bigint not null primary key,
 should_be_licensed boolean
);

INSERT INTO test.gazetteer (uprn, address_label) VALUES (1, '1 abc lane');
INSERT INTO test.gazetteer (uprn, address_label) VALUES (2, '2 abc lane');
INSERT INTO test.gazetteer (uprn, address_label) VALUES (3, '3 abc lane');
INSERT INTO test.gazetteer (uprn, address_label) VALUES (4, '4 abc lane');
INSERT INTO test.gazetteer (uprn, address_label) VALUES (5, '5 abc lane');
INSERT INTO test.gazetteer (uprn, address_label) VALUES (6, '6 abc lane');
INSERT INTO test.gazetteer (uprn, address_label) VALUES (7, '7 abc lane');
INSERT INTO test.gazetteer (uprn, address_label) VALUES (8, '8 abc lane');
INSERT INTO test.gazetteer (uprn, address_label) VALUES (9, '9 abc lane');
INSERT INTO test.gazetteer (uprn, address_label) VALUES (10, '10 abc lane');
INSERT INTO test.gazetteer (uprn, address_label) VALUES (11, '11 abc lane');
INSERT INTO test.gazetteer (uprn, address_label) VALUES (12, '12 abc lane');
INSERT INTO test.gazetteer (uprn, address_label) VALUES (13, '13 abc lane');

INSERT INTO test.ranking_uprns (uprn, ranking_name) VALUES (1, 'factory');
INSERT INTO test.ranking_uprns (uprn, ranking_name) VALUES (2, 'factory');
INSERT INTO test.ranking_uprns (uprn, ranking_name) VALUES (3, 'factory');
INSERT INTO test.ranking_uprns (uprn, ranking_name) VALUES (4, 'factory');
INSERT INTO test.ranking_uprns (uprn, ranking_name) VALUES (5, 'factory');
INSERT INTO test.ranking_uprns (uprn, ranking_name) VALUES (6, 'factory');
INSERT INTO test.ranking_uprns (uprn, ranking_name) VALUES (7, 'factory');
INSERT INTO test.ranking_uprns (uprn, ranking_name) VALUES (8, 'factory');
INSERT INTO test.ranking_uprns (uprn, ranking_name) VALUES (9, 'factory');
INSERT INTO test.ranking_uprns (uprn, ranking_name) VALUES (10, 'factory');
INSERT INTO test.ranking_uprns (uprn, ranking_name) VALUES (11, 'factory');
INSERT INTO test.ranking_uprns (uprn, ranking_name) VALUES (12, 'factory');
INSERT INTO test.ranking_uprns (uprn, ranking_name) VALUES (13, 'factory');

INSERT INTO test.food (uprn, rating) VALUES (1, '2');
INSERT INTO test.food (uprn, rating) VALUES (2, '1');
INSERT INTO test.food (uprn, rating) VALUES (3, '5');
INSERT INTO test.food (uprn, rating) VALUES (4, '0');
INSERT INTO test.food (uprn, rating) VALUES (5, '2');
INSERT INTO test.food (uprn, rating) VALUES (6, '5');
INSERT INTO test.food (uprn, rating) VALUES (7, '0');
INSERT INTO test.food (uprn, rating) VALUES (8, '0');
INSERT INTO test.food (uprn, rating) VALUES (9, '5');
INSERT INTO test.food (uprn, rating) VALUES (10, '3');
INSERT INTO test.food (uprn, rating) VALUES (11, '2');
INSERT INTO test.food (uprn, rating) VALUES (12, '4');
INSERT INTO test.food (uprn, rating) VALUES (13, '1');

INSERT INTO test.incidents (uprn, amount) VALUES (1, '77');
INSERT INTO test.incidents (uprn, amount) VALUES (2, '0');
INSERT INTO test.incidents (uprn, amount) VALUES (3, '1');
INSERT INTO test.incidents (uprn, amount) VALUES (4, '1');
INSERT INTO test.incidents (uprn, amount) VALUES (5, '2');
INSERT INTO test.incidents (uprn, amount) VALUES (6, '0');
INSERT INTO test.incidents (uprn, amount) VALUES (7, '7');
INSERT INTO test.incidents (uprn, amount) VALUES (8, '5');
INSERT INTO test.incidents (uprn, amount) VALUES (9, '7');
INSERT INTO test.incidents (uprn, amount) VALUES (10, '2');
INSERT INTO test.incidents (uprn, amount) VALUES (11, '0');
INSERT INTO test.incidents (uprn, amount) VALUES (12, '1');
INSERT INTO test.incidents (uprn, amount) VALUES (13, '4');

INSERT INTO test.heritage (uprn) VALUES (1);
INSERT INTO test.heritage (uprn) VALUES (2);
INSERT INTO test.heritage (uprn) VALUES (4);
INSERT INTO test.heritage (uprn) VALUES (6);
INSERT INTO test.heritage (uprn) VALUES (9);

INSERT INTO wmfs.building (uprn, should_be_licensed) VALUES (1, TRUE);
INSERT INTO wmfs.building (uprn, should_be_licensed) VALUES (2, FALSE);
INSERT INTO wmfs.building (uprn, should_be_licensed) VALUES (3, FALSE);
INSERT INTO wmfs.building (uprn, should_be_licensed) VALUES (4, FALSE);
INSERT INTO wmfs.building (uprn, should_be_licensed) VALUES (5, TRUE);
INSERT INTO wmfs.building (uprn, should_be_licensed) VALUES (6, FALSE);
INSERT INTO wmfs.building (uprn, should_be_licensed) VALUES (7, FALSE);
INSERT INTO wmfs.building (uprn, should_be_licensed) VALUES (8, FALSE);
INSERT INTO wmfs.building (uprn, should_be_licensed) VALUES (9, TRUE);
INSERT INTO wmfs.building (uprn, should_be_licensed) VALUES (10, TRUE);
INSERT INTO wmfs.building (uprn, should_be_licensed) VALUES (11, FALSE);
INSERT INTO wmfs.building (uprn, should_be_licensed) VALUES (12, FALSE);
INSERT INTO wmfs.building (uprn, should_be_licensed) VALUES (13, TRUE);

COMMIT;
