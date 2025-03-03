 INSERT INTO continent (id, created_on, name, updated_on)
 	VALUES
 	 (0, '2025-01-01T20:04:59', 'Test continent 0', '2025-02-01T10:00:00'),
 	 (1, '2025-01-15T08:00:05', 'Test continent 1', null),
 	 (2, '2024-08-10T15:41:22', 'Test continent 2', null),
 	 (3, '2025-01-15T08:00:06', 'Test continent 3', null);

 INSERT INTO country (id, created_on, name, updated_on, continent_id)
    VALUES
    (0, '2024-08-20T20:04:59', 'Test country 0', null, 0),
    (1, '2025-02-01T20:04:59', 'Test country 1', null, 1),
    (2, '2025-02-01T20:05:01', 'Test country 2', null, 0),
    (3, '2025-02-02T08:14:00', 'Test country 3', null, 0),
    (4, '2025-03-01T22:05:11', 'Test country 4', null, 1);

INSERT INTO region(created_on, name, updated_on, country_id)
	VALUES
    ('2024-08-20T20:04:59', 'Test region 0', null, 0),
    ('2024-10-05T12:32:10', 'Test region 1', null, 0),
    ('2025-01-01T20:04:59', 'Test region 2', '2025-02-12T04:10:20', 1),
    ('2025-01-01T20:05:00', 'Test region 3', null, 1),
    ('2025-02-10T09:23:43', 'Test region 4', null, 0);
