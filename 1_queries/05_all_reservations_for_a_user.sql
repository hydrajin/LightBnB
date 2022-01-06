--MY ATTEMPT 
/*
SELECT reservations.*, properties.*, AVG(property_reviews.rating) AS average_rating
FROM properties
JOIN reservations ON property_id = properties.id
JOIN property_reviews ON reservation_id = reservations.id
WHERE property_reviews.guest_id = '1'
AND reservations.end_date < now()::DATE
GROUP BY properties.id, reservations.id
ORDER BY reservations.start_date
LIMIT 10; */

SELECT properties.*, reservations.*, AVG(rating) AS average_rating
FROM reservations
JOIN properties ON reservations.property_id = properties.id
JOIN property_reviews ON properties.id = property_reviews.property_id
WHERE reservations.guest_id = 1
AND reservations.end_date < now()::date
GROUP BY properties.id, reservations.id
ORDER BY reservations.start_date
LIMIT 10;