CREATE SCHEMA IF NOT EXISTS test;

DROP VIEW IF EXISTS test.factory_scores;

DROP TABLE IF EXISTS test.food;
DROP TABLE IF EXISTS test.fsman;
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
 last_audit text,
 last_audit_date timestamp with time zone,
 last_enforcement_action text,
 growth_curve numeric
);

CREATE TABLE test.food (
 uprn bigint not null primary key,
 rating int
);

CREATE TABLE test.fsman (
 uprn bigint not null primary key,
 rating text
);

CREATE TABLE test.incidents (
 uprn bigint not null primary key,
 amount int
);

CREATE TABLE test.heritage (
 uprn bigint not null primary key
);

INSERT INTO test.gazetteer (uprn, address_label) VALUES (1, '1 abc lane');
INSERT INTO test.gazetteer (uprn, address_label) VALUES (2, '2 abc lane');
INSERT INTO test.gazetteer (uprn, address_label) VALUES (3, '3 abc lane');
INSERT INTO test.gazetteer (uprn, address_label) VALUES (4, '4 abc lane');
INSERT INTO test.gazetteer (uprn, address_label) VALUES (5, '5 abc lane');
INSERT INTO test.gazetteer (uprn, address_label) VALUES (6, '6 abc lane');

INSERT INTO test.ranking_uprns (uprn, ranking_name, last_audit_date) VALUES (1, 'factory', '2018-03-01 09:52:31.62943+01');
INSERT INTO test.ranking_uprns (uprn, ranking_name, last_audit_date) VALUES (2, 'factory', '2018-02-01 09:52:31.62943+01');
INSERT INTO test.ranking_uprns (uprn, ranking_name, last_audit_date) VALUES (3, 'factory', '2018-01-02 09:52:31.62943+01');
INSERT INTO test.ranking_uprns (uprn, ranking_name, last_audit_date) VALUES (4, 'factory', '2018-03-02 09:52:31.62943+01');
INSERT INTO test.ranking_uprns (uprn, ranking_name, last_audit_date) VALUES (5, 'factory', '2017-11-15 09:52:31.62943+01');
INSERT INTO test.ranking_uprns (uprn, ranking_name) VALUES (6, 'factory');

INSERT INTO test.food (uprn, rating) VALUES (1, '2');
INSERT INTO test.food (uprn, rating) VALUES (2, '1');
INSERT INTO test.food (uprn, rating) VALUES (3, '5');
INSERT INTO test.food (uprn, rating) VALUES (4, '0');
INSERT INTO test.food (uprn, rating) VALUES (5, '2');
INSERT INTO test.food (uprn, rating) VALUES (6, '5');

INSERT INTO test.fsman (uprn, rating) VALUES (1, 'Very low');
INSERT INTO test.fsman (uprn, rating) VALUES (2, 'Low');
INSERT INTO test.fsman (uprn, rating) VALUES (3, 'Very low');
INSERT INTO test.fsman (uprn, rating) VALUES (4, 'Very low');
INSERT INTO test.fsman (uprn, rating) VALUES (5, 'Very low');
INSERT INTO test.fsman (uprn, rating) VALUES (6, 'Very low');

INSERT INTO test.incidents (uprn, amount) VALUES (1, '5');
INSERT INTO test.incidents (uprn, amount) VALUES (2, '0');
INSERT INTO test.incidents (uprn, amount) VALUES (3, '1');
INSERT INTO test.incidents (uprn, amount) VALUES (4, '1');
INSERT INTO test.incidents (uprn, amount) VALUES (5, '2');
INSERT INTO test.incidents (uprn, amount) VALUES (6, '0');

INSERT INTO test.heritage (uprn) VALUES (1);
INSERT INTO test.heritage (uprn) VALUES (2);
INSERT INTO test.heritage (uprn) VALUES (4);

INSERT INTO wmfs.building (uprn, should_be_licensed) VALUES (1, TRUE);
INSERT INTO wmfs.building (uprn, should_be_licensed) VALUES (2, FALSE);
INSERT INTO wmfs.building (uprn, should_be_licensed) VALUES (3, FALSE);
INSERT INTO wmfs.building (uprn, should_be_licensed) VALUES (4, FALSE);
INSERT INTO wmfs.building (uprn, should_be_licensed) VALUES (5, TRUE);
INSERT INTO wmfs.building (uprn, should_be_licensed) VALUES (6, FALSE);

COMMIT;