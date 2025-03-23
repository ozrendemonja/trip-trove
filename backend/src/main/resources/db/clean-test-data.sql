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