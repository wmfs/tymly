INSERT INTO tymly.todos (user_id, state_machine_title, state_machine_category,
todo_title, description, required_human_input, launches, id)
VALUES
('test-user', 'Process expense claim', 'expenses', 'Homer Simpson',
 'Homer Simpson is claiming $12 for A pack of Duff Beer', '{}', '{}', '5200987c-bb03-11e7-abc4-cec278b6b50a');

INSERT INTO tymly.todos (user_id, state_machine_title, state_machine_category,
  todo_title, description, required_human_input, launches, id)
  VALUES
  ('test-user', 'wmfs_bookSomeoneSick_1_0', 'hr', 'Vincent Vega',
   'Acknowledge Vincent Vega has booked sick Friday 27th October 2017', '{}', '{}',
    '0d625558-ce99-11e7-b7e3-c38932399c15');

INSERT INTO tymly.todos (user_id, state_machine_title, state_machine_category,
 todo_title, description, required_human_input, launches)
 VALUES
 ('test-user-2', 'Process expense claim', 'expenses', 'Walter White',
  'Walter White is claiming $35 for A large plastic container', '{}', '{}');

INSERT INTO tymly.todos (team_name, state_machine_title, state_machine_category,
todo_title, description, required_human_input, launches)
VALUES
('test-team', 'wmfs_addIncidentSafetyRecord', 'incidents', '1234/2017',
 'RTC with 3 casualties and 0 fatalities', '{}', '{}');