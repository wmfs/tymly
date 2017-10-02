DROP VIEW IF EXISTS fbot.solr_data;

DROP TABLE IF EXISTS fbot_test.students;
DROP TABLE IF EXISTS fbot_test.staff;

CREATE TABLE fbot_test.students (
  student_no integer NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  character_name text NOT NULL,
  _created timestamp with time zone NOT NULL DEFAULT now(),
  _modified timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT students_pkey PRIMARY KEY (student_no)
);

INSERT INTO fbot_test.students (student_no, first_name, last_name, character_name) VALUES (1, 'Daniel', 'Radcliffe', 'Harry Potter');
INSERT INTO fbot_test.students (student_no, first_name, last_name, character_name) VALUES (2, 'Rupert', 'Grint', 'Ron Weasley');
INSERT INTO fbot_test.students (student_no, first_name, last_name, character_name) VALUES (3, 'Emma', 'Watson', 'Hermione Granger');
INSERT INTO fbot_test.students (student_no, first_name, last_name, character_name) VALUES (4, 'Matthew', 'Lewis', 'Neville Longbottom');
INSERT INTO fbot_test.students (student_no, first_name, last_name, character_name) VALUES (5, 'Evanna', 'Lynch', 'Luna Lovegood');
INSERT INTO fbot_test.students (student_no, first_name, last_name, character_name) VALUES (6, 'Tom', 'Felton', 'Draco Malfoy');
INSERT INTO fbot_test.students (student_no, first_name, last_name, character_name) VALUES (7, 'Genevieve', 'Gaunt', 'Pansy Parkinson');
INSERT INTO fbot_test.students (student_no, first_name, last_name, character_name) VALUES (8, 'James', 'Phelps', 'Fred Weasley');
INSERT INTO fbot_test.students (student_no, first_name, last_name, character_name) VALUES (9, 'Oliver', 'Phelps', 'George Weasley');
INSERT INTO fbot_test.students (student_no, first_name, last_name, character_name) VALUES (10, 'Bonnie', 'Wright', 'Ginny Weasley');

CREATE TABLE fbot_test.staff (
  staff_no integer NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  character_first_name text NOT NULL,
  character_last_name text NOT NULL,
  _created timestamp with time zone NOT NULL DEFAULT now(),
  _modified timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT staff_pkey PRIMARY KEY (staff_no)
);

INSERT INTO fbot_test.staff (staff_no, first_name, last_name, character_first_name, character_last_name) VALUES (1, 'Richard', 'Harris', 'Albus', 'Dumbledore');
INSERT INTO fbot_test.staff (staff_no, first_name, last_name, character_first_name, character_last_name) VALUES (2, 'Warwick', 'Davis', 'Filius', 'Flitwick');
INSERT INTO fbot_test.staff (staff_no, first_name, last_name, character_first_name, character_last_name) VALUES (3, 'Apple', 'Brook', 'Wilhelmina', 'Grubbly-Plank');
INSERT INTO fbot_test.staff (staff_no, first_name, last_name, character_first_name, character_last_name) VALUES (4, 'Robbie', 'Coltrane', 'Rubeus', 'Hagrid');
INSERT INTO fbot_test.staff (staff_no, first_name, last_name, character_first_name, character_last_name) VALUES (5, 'Maggie', 'Smith', 'Minerva', 'McGonagall');
INSERT INTO fbot_test.staff (staff_no, first_name, last_name, character_first_name, character_last_name) VALUES (6, 'Jim', 'Broadbent', 'Horace', 'Slughorn');
INSERT INTO fbot_test.staff (staff_no, first_name, last_name, character_first_name, character_last_name) VALUES (7, 'Alan', 'Rickman', 'Severus', 'Snape');
INSERT INTO fbot_test.staff (staff_no, first_name, last_name, character_first_name, character_last_name) VALUES (8, 'Miriam', 'Margolyes', 'Pomona', 'Sprout');
INSERT INTO fbot_test.staff (staff_no, first_name, last_name, character_first_name, character_last_name) VALUES (9, 'Emma', 'Thompson', 'Sybill', 'Trelawney');

COMMIT;
