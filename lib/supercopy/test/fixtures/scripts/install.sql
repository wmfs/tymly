CREATE SCHEMA IF NOT EXISTS supercopy_test;

CREATE TABLE supercopy_test.adults (
  adult_no INTEGER PRIMARY KEY,
  first_name TEXT,
  last_name TEXT
);

INSERT INTO supercopy_test.adults (adult_no, first_name, last_name)
VALUES
 (20, 'Homer', 'Simpson'),
 (60, 'Abraham', 'Simpson');

CREATE TABLE supercopy_test.children (
  child_no INTEGER PRIMARY KEY,
  first_name TEXT,
  last_name TEXT
);

INSERT INTO supercopy_test.children (child_no, first_name, last_name)
VALUES
 (10, 'Lisa', 'Simpson'),
 (30, 'Bartholomew', 'Simpson'),
 (70, 'Milhouse', 'Van Houten');
