DROP VIEW IF EXISTS test.factory_scores;

DROP TABLE IF EXISTS test.test_stats;
DROP TABLE IF EXISTS test.food;
DROP TABLE IF EXISTS test.fsman;
DROP TABLE IF EXISTS test.incidents;
DROP TABLE IF EXISTS test.heritage;
DROP TABLE IF EXISTS test.gazetteer;
DROP TABLE IF EXISTS test.ranking_uprns;
DROP TABLE IF EXISTS test.model_stats;
DELETE FROM wmfs.building WHERE uprn in (1,2,3,4,5,6,7,8,9,10,11,12,13);

DROP SCHEMA IF EXISTS test;
DROP SCHEMA IF EXISTS tymly CASCADE;