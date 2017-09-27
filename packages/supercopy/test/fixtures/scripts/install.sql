BEGIN;

CREATE SCHEMA IF NOT EXISTS supercopy_test;

DROP TABLE IF EXISTS supercopy_test.children;
DROP TABLE IF EXISTS supercopy_test.adults;
DROP TABLE IF EXISTS supercopy_test.establishment;

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

CREATE TABLE supercopy_test.establishment (
  FHRSID INTEGER PRIMARY KEY,
  LocalAuthorityBusinessID TEXT,
  BusinessName TEXT,
  BusinessType TEXT,
  BusinessTypeID INTEGER,
  AddressLine1 TEXT,
  AddressLine2 TEXT,
  AddressLine3 TEXT,
  AddressLine4 TEXT,
  PostCode TEXT,
  RatingValue TEXT,
  RatingKey TEXT,
  RightToReply TEXT,
  RatingDate TEXT,
  LocalAuthorityCode INTEGER,
  LocalAuthorityName TEXT,
  LocalAuthorityWebSite TEXT,
  LocalAuthorityEmailAddress TEXT,
  Hygiene INTEGER,
  Structural INTEGER,
  ConfidenceInManagement INTEGER,
  SchemeType TEXT,
  NewRatingPending TEXT,
  Longitude NUMERIC,
  Latitude NUMERIC,
  Distance NUMERIC
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

COMMIT;