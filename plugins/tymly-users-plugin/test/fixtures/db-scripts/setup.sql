CREATE SCHEMA IF NOT EXISTS tymly_users_test;

CREATE TABLE tymly_users_test.notifications (
  user_id text NOT NULL,
  notification_id text PRIMARY KEY NOT NULL,
  title text,
  description text,
  category text,
  _created timestamp with time zone NOT NULL DEFAULT now(),
  _created_by text,
  _modified timestamp with time zone NOT NULL DEFAULT now(),
  _modified_by text
);

CREATE TABLE tymly_users_test.launches (
  title text NOT NULL, -- Where was the launch triggered?
  state_machine_name text, -- What state machine is this part of?
  input jsonb,
  notifications_notification_id text, -- Auto-added foreign key for notifications
  id uuid PRIMARY KEY NOT NULL DEFAULT uuid_generate_v1(),
  _created timestamp with time zone NOT NULL DEFAULT now(),
  _created_by text,
  _modified timestamp with time zone NOT NULL DEFAULT now(),
  _modified_by text
);

INSERT INTO tymly_users_test.notifications (user_id, notification_id, title, description, category)
VALUES
('user1', '97fd076e-b8b2-11e7-abc4-cec278b6b50a', 'Expense claim #1', 'FIRST', 'expenses');

INSERT INTO tymly_users_test.notifications (user_id, notification_id, title, description, category)
VALUES
('user2', '97fd09f8-b8b2-11e7-abc4-cec278b6b50a', 'Expense claim #2', 'SECOND', 'expenses');

INSERT INTO tymly_users_test.notifications (user_id, notification_id, title, description, category)
VALUES
('user1', '97fd0b06-b8b2-11e7-abc4-cec278b6b50a', 'Expense claim #3', 'THIRD', 'expenses');

INSERT INTO tymly_users_test.notifications (user_id, notification_id, title, description, category)
VALUES
('user1', '97fd13a8-b8b2-11e7-abc4-cec278b6b50a', 'Employee Info #1', 'FOURTH', 'information');

INSERT INTO tymly_users_test.notifications (user_id, notification_id, title, description, category)
VALUES
('user1', '97fd1470-b8b2-11e7-abc4-cec278b6b50a', 'Employee Info #2', 'FIFTH', 'information');

INSERT INTO tymly_users_test.notifications (user_id, notification_id, title, description, category)
VALUES
('user2', '97fd152e-b8b2-11e7-abc4-cec278b6b50a', 'Employee Info #3', 'SIXTH', 'information');

INSERT INTO tymly_users_test.launches (title, state_machine_name, input, notifications_notification_id)
VALUES
('View', 'wmfs_viewCompletedExpenseClaim_1_0', '{"claimNo": 3}', '97fd076e-b8b2-11e7-abc4-cec278b6b50a');


INSERT INTO tymly_users_test.launches (title, state_machine_name, input, notifications_notification_id)
VALUES
('View', 'wmfs_viewCompletedExpenseClaim_1_0', '{"claimNo": 1}', '97fd09f8-b8b2-11e7-abc4-cec278b6b50a');


INSERT INTO tymly_users_test.launches (title, state_machine_name, input, notifications_notification_id)
VALUES
('View', 'wmfs_viewCompletedExpenseClaim_1_0', '{"claimNo": 4}', '97fd0b06-b8b2-11e7-abc4-cec278b6b50a');


INSERT INTO tymly_users_test.launches (title, state_machine_name, input, notifications_notification_id)
VALUES
('View', 'wmfs_viewEmployeeInfo_1_0', '{"employeeNo": 3}', '97fd13a8-b8b2-11e7-abc4-cec278b6b50a');


INSERT INTO tymly_users_test.launches (title, state_machine_name, input, notifications_notification_id)
VALUES
('View', 'wmfs_viewEmployeeInfo_1_0', '{"employeeNo": 34}', '97fd1470-b8b2-11e7-abc4-cec278b6b50a');


INSERT INTO tymly_users_test.launches (title, state_machine_name, input, notifications_notification_id)
VALUES
('View', 'wmfs_viewEmployeeInfo_1_0', '{"employeeNo": 14}', '97fd152e-b8b2-11e7-abc4-cec278b6b50a');

