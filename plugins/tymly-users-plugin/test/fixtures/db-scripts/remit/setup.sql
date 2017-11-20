INSERT INTO tymly.categories (label, description)
VALUES ('Gazetteer', 'Things to do with individual buildings and other property');
INSERT INTO tymly.categories (label, description)
VALUES ('Fire', 'Fire-related incidents');
INSERT INTO tymly.categories (label, description)
VALUES ('Water', 'All things water and hydrants');

INSERT INTO tymly.teams (title, description)
VALUES ('Fire Safety (North)', 'Fire Safety Team for the northern region');
INSERT INTO tymly.teams (title, description)
VALUES ('Birmingham (Red watch)', 'Birmingham Fire Station (Red Watch)');

INSERT INTO tymly.todos (state_machine_title, state_machine_category, todo_title, id)
VALUES ('Process expense claim', 'expenses', 'Homer Simpson', 'a69c0ac9-cde5-11e7-abc4-cec278b6b50a');
INSERT INTO tymly.todos (state_machine_title, state_machine_category, todo_title, id)
VALUES ('wmfs_bookSomeoneSick_1_0', 'hr', 'Vincent Vega', 'a69c0ae8-cde5-11e7-abc4-cec278b6b50a');
INSERT INTO tymly.todos (team_name, state_machine_title, state_machine_category, todo_title, id)
VALUES ('birminghamRedWatch', 'wmfs_addIncidentSafetyRecord', 'incidents', '1234/2017', 'a69c0dcc-cde5-11e7-abc4-cec278b6b50a');
INSERT INTO tymly.todos (team_name, state_machine_title, state_machine_category, todo_title, id)
VALUES ('northernFireSafety', 'processFireSafetyAudit', 'fireSafety', 'Tymly Kebabs', 'a69c1178-cde5-11e7-abc4-cec278b6b50a');
