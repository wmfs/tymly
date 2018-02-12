DROP SCHEMA IF EXISTS pginfo_people_test CASCADE;

CREATE SCHEMA pginfo_people_test;

COMMENT ON SCHEMA pginfo_people_test IS 'Simple schema created to support testing of the pg-info package!';

CREATE TABLE pginfo_people_test.people (
  person_no text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  age integer,
  _created timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT person_pkey PRIMARY KEY (person_no)
);

COMMENT ON TABLE pginfo_people_test.people IS 'Isn''t this just a list of people?';
COMMENT ON COLUMN pginfo_people_test.people.first_name IS 'Person''s first name';
COMMENT ON COLUMN pginfo_people_test.people.age IS 'Age in years';
COMMENT ON COLUMN pginfo_people_test.people._created IS 'Timestamp for when this record was created';

CREATE INDEX people_age_idx ON pginfo_people_test.people (age);
CREATE INDEX people_first_name_last_name_idx ON pginfo_people_test.people (first_name, last_name);

DROP SCHEMA IF EXISTS pginfo_planets_test CASCADE;
CREATE SCHEMA pginfo_planets_test;
COMMENT ON SCHEMA pginfo_planets_test IS 'Schema containing 3 related tables to support testing of the pg-info package!';

CREATE TABLE pginfo_planets_test.planets
(
  name text NOT NULL,
  title text NOT NULL,
  type text,
  diameter numeric,
  color numeric,
  url text,
  tags text[],
  other_facts JSONB,
  _created timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT planets_pkey PRIMARY KEY (name)
);

CREATE INDEX other_facts_idx on pginfo_planets_test.planets USING GIN (other_facts);

COMMENT ON TABLE pginfo_planets_test.planets IS 'A list of planets';
COMMENT ON COLUMN pginfo_planets_test.planets.name IS 'Unique planet name';
COMMENT ON COLUMN pginfo_planets_test.planets.title IS 'The display-label of the planet';
COMMENT ON COLUMN pginfo_planets_test.planets.type IS 'What type of planet is this?';
COMMENT ON COLUMN pginfo_planets_test.planets.diameter IS 'The diameter of the planet, in metres';
COMMENT ON COLUMN pginfo_planets_test.planets.color IS 'What color is this planet?';
COMMENT ON COLUMN pginfo_planets_test.planets.url IS 'Further reading available here!';
COMMENT ON COLUMN pginfo_planets_test.planets._created IS 'Timestamp for when this record was created';


CREATE TABLE pginfo_planets_test.moons
(
  id uuid NOT NULL,
  title text NOT NULL,
  discovered_by text,
  discovery_year integer,
  planet_name text,
  _created timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT moons_pkey PRIMARY KEY (id),
  CONSTRAINT moons_to_planets_fk FOREIGN KEY (planet_name)
      REFERENCES pginfo_planets_test.planets (name) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
);
COMMENT ON TABLE pginfo_planets_test.moons IS 'Auto-generated via Tableware.js!';
COMMENT ON COLUMN pginfo_planets_test.moons.title IS 'The display-label of the moon';
COMMENT ON COLUMN pginfo_planets_test.moons.discovered_by IS 'Name of the person who discovered the moon';
COMMENT ON COLUMN pginfo_planets_test.moons.discovery_year IS 'Year the moon was discovered (e.g. 1804)';
COMMENT ON COLUMN pginfo_planets_test.moons.planet_name IS 'Auto-added foreign key for planets';
COMMENT ON COLUMN pginfo_planets_test.moons.id IS 'Automatically added UUID-based primary key column';
COMMENT ON COLUMN pginfo_planets_test.moons._created IS 'Timestamp for when this record was created';

CREATE INDEX moons_planets_name_idx ON pginfo_planets_test.moons (planet_name);

CREATE TABLE pginfo_planets_test.craters
(
  id uuid NOT NULL,
  title text NOT NULL,
  diameter integer,
  moons_id uuid,
  _created timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT craters_pkey PRIMARY KEY (id),
  CONSTRAINT craters_to_moons_fk FOREIGN KEY (moons_id)
      REFERENCES pginfo_planets_test.moons (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
);
COMMENT ON TABLE pginfo_planets_test.craters IS 'Auto-generated via Tableware.js!';
COMMENT ON COLUMN pginfo_planets_test.craters.title IS 'The display-label of the crater';
COMMENT ON COLUMN pginfo_planets_test.craters.diameter IS 'Diameter of the crater, in metres';
COMMENT ON COLUMN pginfo_planets_test.craters.moons_id IS 'Auto-added foreign key for moons';
COMMENT ON COLUMN pginfo_planets_test.craters.id IS 'Automatically added UUID-based primary key column';
COMMENT ON COLUMN pginfo_planets_test.craters._created IS 'Timestamp for when this record was created';

CREATE INDEX craters_moons_id_idx ON pginfo_planets_test.craters (moons_id);

CREATE TABLE pginfo_planets_test.new_craters (
    id uuid NOT NULL,
    title text NOT NULL,
    CONSTRAINT new_craters_pkey PRIMARY KEY (id)
);

CREATE OR REPLACE FUNCTION pginfo_planets_test.append_inserted_craters_row()
    RETURNS trigger AS
$BODY$
    BEGIN
        INSERT INTO pginfo_planets_test.new_craters (id, title) VALUES (new.id, new.title);
        RETURN NEW;
    END;
$BODY$
    LANGUAGE plpgsql;

CREATE TRIGGER new_craters_trigger
BEFORE INSERT ON pginfo_planets_test.craters
EXECUTE PROCEDURE pginfo_planets_test.append_inserted_craters_row();