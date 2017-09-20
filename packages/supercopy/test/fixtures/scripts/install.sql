CREATE SCHEMA IF NOT EXISTS supercopy_test;

CREATE TABLE supercopy_test.adults (
  adult_no INTEGER PRIMARY KEY,
  first_name TEXT,
  last_name TEXT
);

CREATE TABLE supercopy_test.children (
  child_no INTEGER PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  father_no INTEGER REFERENCES supercopy_test.adults (adult_no) ON DELETE SET NULL,
  mother_no INTEGER REFERENCES supercopy_test.adults (adult_no) ON DELETE SET NULL
);

INSERT INTO supercopy_test.adults (adult_no, first_name, last_name)
VALUES
 (10, 'Homer', 'Simpson'),
 (20, 'Marge', 'Simpson'),
 (30, 'Maud', 'Flanders'),
 (40, 'Ned', 'Flanderz'),
 (50, 'Seymour', 'Skinner'),
 (60, 'Charles', 'Burns'),
 (70, 'Waylon', 'Smithers'),
 (80, 'Clancy', 'Wigum');

INSERT INTO supercopy_test.children (child_no, first_name, last_name, father_no, mother_no)
VALUES
 (10, 'Lisa', 'Simpson', 10, 20),
 (20, 'Bartholomew', 'Simpson', 10, 20),
 (30, 'Maggie', 'Simpson', 10, 20),
 (40, 'Rod', 'Flanders', 40, 30),
 (50, 'Tod', 'Flanders', 40, 30),
 (60, 'Nelson', 'Muntz', NULL, NULL);
