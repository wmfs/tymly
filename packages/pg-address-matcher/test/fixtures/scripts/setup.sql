CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";

CREATE SCHEMA IF NOT EXISTS match_test;

CREATE TABLE match_test.addressbase (
    address_id bigint NOT NULL PRIMARY KEY,
    parent_address_id bigint,
    longitude numeric(16,8),
    latitude numeric(17,8),
    organisation_name text,
    organisation text,
    sub_building_name text,
    building_name text,
    building_number integer,
    area_name text,
    street_description text,
    postcode text
);

INSERT INTO match_test.addressbase
(address_id,parent_address_id,longitude,latitude,organisation_name,organisation,
sub_building_name,building_name,building_number,area_name,street_description,postcode) VALUES
(111,null,52.48478840,-1.51592770,'TIMS KEBABS',null,null,null,null,'BEDWORTH','CASTLE LANE','CV12 0NF'),
(100,null,52.48478840,-1.51592770,'TIMS KEBABS',null,null,null,null,'WEDWORTH','CASTLE LANE','B12 0XF'),
(222,null,53.03270430,-2.23390820,null,null,null,null,null,'NEWCASTLE UNDER LYME','DIMSDALE HALL DRIVE','ST5 9DR'),
(333,null,52.56101260,-2.00552720,null,null,null,null,12,'WEDNESBURY','TYMLY PARK ROAD','WS10 9QR'),
(987,null,52.54935190,-1.84637060,null,null,'APARTMENT 12','EDMOND COURT',3,null,'TURNIP ROAD','B73 5XF'),
(9876,null,52.54935190,-1.84637060,null,null,'APARTMENT 6','EDMOND COURT',3,null,'TURNIP ROAD','B73 5XF'),
(98765,null,52.54935190,-1.84637060,null,null,'APARTMENT 8','EDMOND COURT',3,null,'TURNIP ROAD','B73 5XF'),
(444,null,52.46364640,-1.56049150,null,'SAFE WITH TYMLY',null,null,null,'CORELY','101 CHUCKLE LANE','CV7 8AZ'),
(555,null,52.51436490,-2.06319590,'TYMLY PRIMARY SCHOOL', null,null,null,null,'TIPTON', 'COLD TREE ROAD','DY4 7UF'),
(666,null,52.60086440,-1.61572840,null,'VEGGY LAND',null,null,9,'DORDON','RED LANE','B78 1TR'),
(777,null,52.44757800,-2.33931700,null,'ALL THE FOOD RESTAURANT AND CAFE',null,null,5,'SHROPSHIRE','GREEN STREET','WV15 6JA'),
(888,null,52.46591000,-2.00897800,null,'CARING FOR YOU',null,null,423,'SANDWELL','CASTLE ROAD','B68 0QY');

CREATE TABLE match_test.food (
  food_id bigint NOT NULL PRIMARY KEY,
  local_authority_business_id text,
  business_name text,
  business_type text,
  business_type_id integer,
  address_line_1 text,
  address_line_2 text,
  postcode text,
  rating_value text,
  local_authority_code integer,
  local_authority_name text,
  scheme_type text,
  longitude numeric(16,8),
  latitude numeric(17,8)
);

INSERT INTO match_test.food
(food_id, local_authority_business_id, business_name, business_type, business_type_id,
address_line_1, address_line_2, postcode, rating_value, local_authority_code,
local_authority_name, longitude, latitude)
VALUES
(111111,'1155','Tims Kebabs','Takeaway/sandwich shop',7844,null,
'Castle Lane','CV12 0NF','4',317,'North Warwickshire',52.48478000,-1.51594900),
(222222,'1001','Gin with Tim','Pub/bar/nightclub',7843,'Gin with Tim',
'South Parade','ST5 9DR','3',290,'Newcastle-Under-Lyme',52.99408800,-2.28174100),
(333333,'1011','Bulls Head','Pub/bar/nightclub',7843,'Bulls Head',
'12 Tymly Park Road','WS10 9QR','5',423,'Sandwell',52.55993600,-2.00485300),
(444444,'1028','Safe with Tymly','Hospitals/Childcare/Caring Premises',7843,null,
'Chuckle Lane','CV7 8AZ','5',317,'North Warwickshire',52.46272600,-1.56175900),
(555555,'1037','Tymly Primary','School/college/university',7843,'Tymly Primary School',
'Cold Tree','DY4 7UF','4',423,'Sandwell',52.51494200,-2.06389400),
(666666,'1155','Veggie land','Restaurant/Cafe/Canteen',7844,null,
'9 Red Lane','B78 1TR','1',317,'North Warwickshire',52.60082000,-1.61584000),
(777777,'1066','All the food','Restaurant/Cafe/Canteen',5,'Green Street',
'Alveley','WV15 6JA','5',708,'Shropshire',52.44757800,-2.33931700),
(888888,'109','Caring 4 U','Hospitals/Childcare/Caring Premises',7845,'Caring 4 you',
'Castle Road','B68 0QY','5',423,'Sandwell',52.46591000,-2.00897800),
(987654,'PI/000501839','Edmond Court','Other catering premises',7841,
'339 Turnip Road','Birmingham','B73 5XF','5',402,'Birmingham',52.54956200,-1.84667200);