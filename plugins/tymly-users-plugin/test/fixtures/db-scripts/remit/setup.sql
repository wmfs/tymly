INSERT INTO tymly.teams (title, description, id)
VALUES ('Fire Safety (North)', 'Fire Safety Team for the northern region', 'a69c0ad4-cde5-11e7-abc4-cec278b6b50a');
INSERT INTO tymly.teams (title, description, id)
VALUES ('Birmingham (Red watch)', 'Birmingham Fire Station (Red Watch)', 'a69c0ae5-cde5-11e7-abc4-cec278b6b50a');

INSERT INTO tymly.todos (user_id, state_machine_title, state_machine_category, todo_title, id)
VALUES ('test-user', 'Process expense claim', 'expenses', 'Homer Simpson', 'a69c0ac9-cde5-11e7-abc4-cec278b6b50a');
INSERT INTO tymly.todos (user_id, state_machine_title, state_machine_category, todo_title, id)
VALUES ('test-user-3', 'wmfs_bookSomeoneSick_1_0', 'hr', 'Vincent Vega', 'a69c0ae8-cde5-11e7-abc4-cec278b6b50a');
INSERT INTO tymly.todos (team_name, state_machine_title, state_machine_category, todo_title, id)
VALUES ('birminghamRedWatch', 'wmfs_addIncidentSafetyRecord', 'incidents', '1234/2017', 'a69c0dcc-cde5-11e7-abc4-cec278b6b50a');
INSERT INTO tymly.todos (team_name, state_machine_title, state_machine_category, todo_title, id)
VALUES ('northernFireSafety', 'processFireSafetyAudit', 'fireSafety', 'Tymly Kebabs', 'a69c1178-cde5-11e7-abc4-cec278b6b50a');
