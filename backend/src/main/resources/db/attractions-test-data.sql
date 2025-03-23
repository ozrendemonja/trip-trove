DELETE FROM attraction WHERE id = 5;
DELETE FROM attraction;
DELETE FROM city;
DELETE FROM region;
DELETE FROM country;
DELETE FROM continent;

ALTER SEQUENCE continent_id_seq RESTART 1;
ALTER SEQUENCE country_id_seq RESTART 1;
ALTER SEQUENCE region_id_seq RESTART 1;
ALTER SEQUENCE city_id_seq RESTART 1;
ALTER SEQUENCE attraction_id_seq RESTART 1;

INSERT INTO continent (created_on, name, updated_on)
 	VALUES
 	 ('2025-01-01T20:04:59', 'Test continent 0', '2025-02-01T10:00:00'),
 	 ('2025-01-15T08:00:05', 'Test continent 1', null),
 	 ('2024-08-10T15:41:22', 'Test continent 2', null),
 	 ('2025-01-15T08:00:06', 'Test continent 3', null)
 	 ON CONFLICT (name) DO NOTHING;

INSERT INTO country (created_on, name, updated_on, continent_id)
    VALUES
    ('2024-08-20T20:04:59', 'Test country 0', null, 1),
    ('2025-02-01T20:04:59', 'Test country 1', null, 2),
    ('2025-02-01T20:05:01', 'Test country 2', null, 1),
    ('2025-02-02T08:14:00', 'Test country 3', null, 1),
    ('2025-03-01T22:05:11', 'Test country 4', null, 3)
 	 ON CONFLICT (id) DO NOTHING;

INSERT INTO region(created_on, name, updated_on, country_id)
	VALUES
    ('2024-08-20T20:04:59', 'Test region 0', null, 1),
    ('2024-10-05T12:32:10', 'Test region 1', null, 1),
    ('2025-01-01T20:04:59', 'Test region 2', '2025-02-12T04:10:20', 2),
    ('2025-01-01T20:05:00', 'Test region 3', null, 3),
    ('2025-02-10T09:23:43', 'Test region 4', null, 5)
     ON CONFLICT (id) DO NOTHING;

INSERT INTO city(created_on, name, updated_on, region_id)
	VALUES
	 ('2024-08-20T20:04:59', 'Test city 0', null, 1),
     ('2024-10-05T12:32:10', 'Test city 1', null, 1),
     ('2025-01-01T20:04:59', 'Test city 4', '2025-02-12T04:10:20', 3),
     ('2025-01-01T20:05:00', 'Test city 3', null, 1),
     ('2025-02-10T09:23:43', 'Test city 4', null, 2)
     ON CONFLICT (id) DO NOTHING;

INSERT INTO attraction(address, latitude, longitude, category, created_on, source_name, source_date, is_countrywide, is_traditional, must_visit, name, visit_period_from, visit_period_to, tip, type, updated_on, city_id, country_id, main_attraction_id, region_id)
	VALUES
	('Test address 1', -7.4247538, 90.000001, 'HISTORIC_SITE', '2024-08-20T22:32:11', 'Functional Test', '2024-08-02T23:12:34', true, true, true, 'Test attraction 0', '2024-10-02T23:11:34', '2024-02-02T23:11:34', 'Test tip', 'STABLE', '2024-08-21T21:31:11', 1, 1, null, 1),
    ('Test address 2', 14.4111964, 50.0865077, 'POINT_OF_INTEREST_AND_LANDMARK', '2024-08-23T08:12:43', 'Functional Test 2', '2024-08-23T08:12:43', false, true, false, 'Test attraction 0', '2024-09-02T23:11:34', '2024-12-02T23:11:34', 'Test tip 2', 'POTENTIAL_CHANGE', null, null, 2, null, 3),
    (null, null, null, 'ART_MUSEUM', '2024-09-14T10:10:47', 'Functional Test', '2024-09-01T07:18:25', false, false, false, 'Test attraction 1', null, null, null, 'STABLE', null, null, 2, null, 3),
    (null, -0.7610531,-90.336817, 'NATURE_AND_WILDLIFE_AREA', '2025-01-10T23:08:41', 'Functional Test 3', '2020-01-10T07:12:00', false, false, false, 'Test attraction 2', null, null, null, 'POTENTIAL_CHANGE', null, 1, 3, null, 4),
    (null, null, null, 'WILDLIFE_TOUR', '2025-02-23T08:12:43', 'Functional Test 3', '2024-08-23T08:12:43', true, true, true, 'Test attraction 3', null, null, null, 'IMMINENT_CHANGE', null, null, 1, 1, 1)
     ON CONFLICT (id) DO NOTHING;
