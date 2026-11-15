DELETE FROM bucket_list_item;
DELETE FROM trip_attraction;
DELETE FROM trip;
UPDATE attraction SET main_attraction_id = null;
DELETE FROM attraction;
DELETE FROM city;
DELETE FROM region;
DELETE FROM country;
DELETE FROM continent;
DELETE FROM information_provider;

INSERT INTO continent(id, name, created_on)
VALUES (1, 'North America', TIMESTAMP '2026-09-01 00:00:00');

INSERT INTO country(id, name, continent_id, iso_code, created_on)
VALUES (1, 'United States', 1, 'us', TIMESTAMP '2026-09-01 00:00:00');

INSERT INTO region(id, name, country_id, created_on, updated_on)
VALUES
    (1, 'Illinois',      1, TIMESTAMP '2026-09-28 12:00:00.123456', null),
    (2, 'Massachusetts', 1, TIMESTAMP '2026-09-01 00:00:00', TIMESTAMP '2026-09-28 12:00:00.123456');

-- Springfield exists in both states; matching city names must not merge their attractions.
INSERT INTO city(id, name, region_id, created_on, updated_on)
VALUES
    (1, 'Springfield', 1, TIMESTAMP '2026-09-28 12:00:00.123456', null),
    (2, 'Urbana',      1, TIMESTAMP '2026-09-01 00:00:00', TIMESTAMP '2026-09-28 12:00:00.123456'),
    (3, 'Springfield', 2, TIMESTAMP '2026-09-28 12:00:00.123456', null),
    (4, 'Worcester',   2, TIMESTAMP '2026-09-01 00:00:00', TIMESTAMP '2026-09-28 12:00:00.123456');

INSERT INTO information_provider(id, name, created_on)
VALUES
    (1,  'Keyset provider 1',  TIMESTAMP '2026-09-01 00:00:00'),
    (2,  'Keyset provider 2',  TIMESTAMP '2026-09-01 00:00:00'),
    (3,  'Keyset provider 3',  TIMESTAMP '2026-09-01 00:00:00'),
    (4,  'Keyset provider 4',  TIMESTAMP '2026-09-01 00:00:00'),
    (5,  'Keyset provider 5',  TIMESTAMP '2026-09-01 00:00:00'),
    (6,  'Keyset provider 6',  TIMESTAMP '2026-09-01 00:00:00'),
    (7,  'Keyset provider 7',  TIMESTAMP '2026-09-01 00:00:00'),
    (8,  'Keyset provider 8',  TIMESTAMP '2026-09-01 00:00:00'),
    (9,  'Keyset provider 9',  TIMESTAMP '2026-09-01 00:00:00'),
    (10, 'Keyset provider 10', TIMESTAMP '2026-09-01 00:00:00'),
    (11, 'Keyset provider 11', TIMESTAMP '2026-09-01 00:00:00'),
    (12, 'Keyset provider 12', TIMESTAMP '2026-09-01 00:00:00');

-- Insertions deliberately interleave regions and cities.
-- Old State Capitol was never updated. EcoTarium is newest but must stay in Massachusetts/Worcester.
-- Lincoln Home and Dana-Thomas House share updated_on; Lincoln Home's higher ID puts it first.
-- Independence Day celebrations are countrywide; only Illinois attractions have must_visit = true.
INSERT INTO attraction(
    id, name, country_id, region_id, city_id, created_on, updated_on,
    category, type, is_countrywide, is_traditional, must_visit, information_provider_id, source_date)
VALUES
    (1,  'EcoTarium',                          1, 2, 4,    TIMESTAMP '2026-09-01 00:00:00', TIMESTAMP '2026-10-01 00:00:00',
     'HISTORIC_SITE', 'STABLE', false, true, false, 1,  DATE '2026-09-01'),
    (2,  'Old State Capitol',                  1, 1, 1,    TIMESTAMP '2026-09-01 00:00:00', null,
     'HISTORIC_SITE', 'STABLE', false, true, true,  2,  DATE '2026-09-01'),
    (3,  'Mohawk Trail',                       1, 2, null, TIMESTAMP '2026-09-01 00:00:00', TIMESTAMP '2026-09-28 12:00:00.123456',
     'HISTORIC_SITE', 'STABLE', false, true, false, 3,  DATE '2026-09-01'),
    (4,  'Meadowbrook Park',                   1, 1, 2,    TIMESTAMP '2026-09-01 00:00:00', TIMESTAMP '2026-09-28 12:00:00.123456',
     'HISTORIC_SITE', 'STABLE', false, true, true,  4,  DATE '2026-09-01'),
    (5,  'Dana-Thomas House',                  1, 1, 1,    TIMESTAMP '2026-09-01 00:00:00', TIMESTAMP '2026-09-28 12:00:00.123456',
     'HISTORIC_SITE', 'STABLE', false, true, true,  5,  DATE '2026-09-01'),
    (6,  'Forest Park',                        1, 2, 3,    TIMESTAMP '2026-09-01 00:00:00', TIMESTAMP '2026-09-28 12:00:00.123456',
     'HISTORIC_SITE', 'STABLE', false, true, false, 6,  DATE '2026-09-01'),
    (7,  'Independence Day celebrations',      1, 1, null, TIMESTAMP '2026-09-01 00:00:00', TIMESTAMP '2026-09-28 12:00:00.123456',
     'HISTORIC_SITE', 'STABLE', true,  true, true,  7,  DATE '2026-09-01'),
    (8,  'Worcester Art Museum',               1, 2, 4,    TIMESTAMP '2026-09-01 00:00:00', TIMESTAMP '2026-09-28 12:00:00.123456',
     'HISTORIC_SITE', 'STABLE', false, true, false, 8,  DATE '2026-09-01'),
    (9,  'Spurlock Museum',                    1, 1, 2,    TIMESTAMP '2026-09-01 00:00:00', TIMESTAMP '2026-09-28 12:00:00.123456',
     'HISTORIC_SITE', 'STABLE', false, true, true,  9,  DATE '2026-09-01'),
    (10, 'Cape Cod National Seashore',         1, 2, null, TIMESTAMP '2026-09-01 00:00:00', TIMESTAMP '2026-09-28 12:00:00.123456',
     'HISTORIC_SITE', 'STABLE', false, true, false, 10, DATE '2026-09-01'),
    (11, 'Basketball Hall of Fame',            1, 2, 3,    TIMESTAMP '2026-09-01 00:00:00', TIMESTAMP '2026-09-28 12:00:00.123456',
     'HISTORIC_SITE', 'STABLE', false, true, false, 11, DATE '2026-09-01'),
    (12, 'Lincoln Home National Historic Site', 1, 1, 1,    TIMESTAMP '2026-09-01 00:00:00', TIMESTAMP '2026-09-28 12:00:00.123456',
     'HISTORIC_SITE', 'STABLE', false, true, true,  12, DATE '2026-09-01');
