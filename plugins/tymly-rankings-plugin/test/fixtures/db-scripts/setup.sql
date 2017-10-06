CREATE SCHEMA IF NOT EXISTS test;

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
 ranking_name text not null
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

INSERT INTO test.gazetteer (uprn, address_label) VALUES (1, '1 abc lane');
INSERT INTO test.gazetteer (uprn, address_label) VALUES (2, '2 abc lane');
INSERT INTO test.gazetteer (uprn, address_label) VALUES (3, '3 abc lane');

INSERT INTO test.ranking_uprns (uprn, ranking_name) VALUES (1, 'factory');
INSERT INTO test.ranking_uprns (uprn, ranking_name) VALUES (2, 'factory');
INSERT INTO test.ranking_uprns (uprn, ranking_name) VALUES (3, 'factory');

INSERT INTO test.food (uprn, rating) VALUES (1, '2');
INSERT INTO test.food (uprn, rating) VALUES (2, '1');
INSERT INTO test.food (uprn, rating) VALUES (3, '5');

INSERT INTO test.incidents (uprn, amount) VALUES (1, '5');
INSERT INTO test.incidents (uprn, amount) VALUES (2, '0');
INSERT INTO test.incidents (uprn, amount) VALUES (3, '1');

INSERT INTO test.heritage (uprn) VALUES (1);
INSERT INTO test.heritage (uprn) VALUES (2);
INSERT INTO test.heritage (uprn) VALUES (3);

COMMIT;