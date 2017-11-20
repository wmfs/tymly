DELETE FROM tymly.categories
WHERE label = 'Gazetteer' AND description = 'Things to do with individual buildings and other property';
DELETE FROM tymly.categories
WHERE label = 'Fire' AND description = 'Fire-related incidents';
DELETE FROM tymly.categories
WHERE label = 'Water' AND description = 'All things water and hydrants';

DELETE FROM tymly.teams
WHERE title = 'Fire Safety (North)' AND description = 'Fire Safety Team for the northern region';
DELETE FROM tymly.teams
WHERE title = 'Birmingham (Red watch)' AND description = 'Birmingham Fire Station (Red Watch)';

DELETE FROM tymly.todos
WHERE id = 'a69c0ac9-cde5-11e7-abc4-cec278b6b50a';
DELETE FROM tymly.todos
WHERE id = 'a69c0ae8-cde5-11e7-abc4-cec278b6b50a';
DELETE FROM tymly.todos
WHERE id = 'a69c0dcc-cde5-11e7-abc4-cec278b6b50a';
DELETE FROM tymly.todos
WHERE id = 'a69c1178-cde5-11e7-abc4-cec278b6b50a';