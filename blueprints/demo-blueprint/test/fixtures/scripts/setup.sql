TRUNCATE TABLE tymly.incidents;
TRUNCATE TABLE tymly.watched_boards;

INSERT INTO tymly.incidents
(incident_number,incident_year,lat,long,over_border,station_area,station_responsible,station_call,position_label,address_lines,call_time,sensitive,incident_status,call_origin,call_details,late_call,initial_type,mobilise_incident_type,incident_result_type,property_type,resource_summary,callsigns)
VALUES (1234,2017,52.485076,-1.876554,false,'E01 (Walsall)','E01 (Walsall)',false,'(401532, 297404)','LITTLE LONDON HOUSE, WEST BROMWICH STREET, PALFREY, WALSALL','03-DEC-17 01:03:43',false,'CLOSED','999','FIRE ALARM ACTUATING IN THE COMMUNAL LANDING CALLER IN FLAT 36 ON THE 9TH FLOOR',false,'SMOKE DETECTOR HIGH RISE','A3 Smoke Alarm','FAE','Dwellings','{"byCallsignType": ["3 PRL","0 HP","0 POD","0 Other"],"byAttendance": ["3 Total appliances","3 Brigade vehicles","0 Over border vehicles","3 Acting pumps","0 Officer cars"],"firstMobilised": "03-DEC-17 01:06:14","firstInAttendance": "03-DEC-17 01:10:23","firstStop": "03-DEC-17 01:20:26","lastApplianceReturned": "03-DEC-17 01:24:46","reactionTime": "1 minute and 52 seconds","responseTime": "5 minutes and 36 seconds"}','[{"callsign": "E011","type": "PPL","crewCount": 5,"assigned": "03-DEC-17 01:04:47","mobilised": "03-DEC-17 01:06:39","attended": "03-DEC-17 01:10:23","stop": "03-DEC-17 01:20:26","released": "03-DEC-17 01:24:46"},{"callsign": "E012","type": "PPL","crewCount": 5,"assigned": "03-DEC-17 01:04:47","mobilised": "03-DEC-17 01:06:43","attended": "03-DEC-17 01:10:39","released": "03-DEC-17 01:23:12"},{"callsign": "E021","type": "PPL","crewCount": 5,"assigned": "03-DEC-17 01:04:47","mobilised": "03-DEC-17 01:06:14","attended": "03-DEC-17 01:13:22","released": "03-DEC-17 01:15:01"}]');

INSERT INTO tymly.watched_boards
(user_id,feed_name,category,category_label,title,description,started_watching,launches)
VALUES ('auth0|5a157ade1932044615a1c502', 'wmfs_incidentSummary_1_0|1234|2017', 'incidents', 'Incidents', 'Incident 1234/2017', 'RTC with 3 casualties and 0 fatalities', null, '[{"input": {"incidentYear": 2017, "incidentNumber": 1234}, "stateMachineName": "tymly_incidentSummary_1_0"}]');


INSERT INTO tymly.watched_boards
(user_id,feed_name,category,category_label,title,description,started_watching,launches)
VALUES ('auth0|5a157ade1932044615a1c502', 'wmfs_incidentInProgress_1_0', 'incidents', 'Incidents', 'Incidents In Progress', 'View incidents in progress', null, '[{"input": {}, "stateMachineName": "tymly_getIncidentsInProgress_1_0"}]');

