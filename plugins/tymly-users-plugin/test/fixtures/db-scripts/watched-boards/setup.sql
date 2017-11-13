CREATE SCHEMA IF NOT EXISTS tymly_users_test;

CREATE TABLE tymly_users_test.watched_boards (
    user_id text,
    subscription_id text NOT NULL PRIMARY KEY, -- This is a UUID, that can be used to uniquely identify any watched board of any user.
    feed_name text, -- A string relating to a particular state-machine-name and key combo. Consider several users requesting updates whenever the details of a particular property change - this equates to a several users subscribing to the property's "feed".
    title text, -- This is the title from the board that the user has subscribed to watch - use when render a the subscription for the user.
    description text, -- This is some more detail to complement title.
    started_watching text, -- A timestamp of when the user wasfirst subscribed to this feed.
    launches_id text, -- A standard launches object that can be used to view the board.
    _created timestamp with time zone NOT NULL DEFAULT now(), -- Timestamp for when this record was created
    _created_by text, -- UserID that created this record (if known)
    _modified timestamp with time zone NOT NULL DEFAULT now(), -- Timestamp for when this record was last updated
    _modified_by text -- UserID that last modified this record (if known)
);

INSERT INTO tymly_users_test.watched_boards (user_id, subscription_id, feed_name, title, description, started_watching)
VALUES
('user2', 'e431ec74-c07f-11e7-abc4-cec278b6b50a', 'wmfs_incidentSummary_1_0|1234|2017', 'Incident 1234/2017', 'RTC with 3 casualties and 0 fatalities',
'2017-10-24T11:12:32.913Z');

INSERT INTO tymly_users_test.watched_boards (user_id, subscription_id, feed_name, title, description, started_watching)
VALUES
('user2', 'c1ce44a6-c0c1-11e7-abc4-cec278b6b50a', 'wmfs_incidentSummary_1_0|12|2015', 'Incident 12/2015', 'Fire with 0 casualties and 0 fatalities',
'2016-10-24T11:12:32.913Z');

INSERT INTO tymly_users_test.watched_boards (user_id, subscription_id, feed_name, title, description, started_watching)
VALUES
('user2', '9f56eb4c-c0af-11e7-abc4-cec278b6b50a', 'wmfs_property_viewer_1_0|4', 'URN #4', 'Tymly Kebabs, Streetly, B74 3RU',
'2017-10-24T11:12:32.913Z');