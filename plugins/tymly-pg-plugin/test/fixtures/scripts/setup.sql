CREATE SCHEMA IF NOT EXISTS refresh_test;
CREATE SCHEMA IF NOT EXISTS refresh_test_other;

DROP TABLE IF EXISTS refresh_test.atest;
DROP TABLE IF EXISTS refresh_test.btest;
DROP TABLE IF EXISTS refresh_test_other.test;

CREATE TABLE refresh_test.atest (
 id bigint not null primary key,
 info text not null
);
CREATE TABLE refresh_test.btest (
 id bigint not null primary key,
 info text not null
);
CREATE TABLE refresh_test_other.test (
 id bigint not null primary key,
 info text not null
);

COMMIT;