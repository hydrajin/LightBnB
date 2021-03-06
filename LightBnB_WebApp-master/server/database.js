const properties = require('./json/properties.json');
const users = require('./json/users.json');

///!---------------------------------------------------  Users
const { Pool } = require('pg');
const query = require("express/lib/middleware/query");

const pool = new Pool({
  // changed user to labber
  user: 'labber',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

pool.connect(()=> {
  console.log('connected to the lightbnb database');
});

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
*/
/*
const getUserWithEmail = function(email) {
  let user;
  for (const userId in users) {
    user = users[userId];
    if (user.email.toLowerCase() === email.toLowerCase()) {
      break;
    } else {
      user = null;
    }
  }
  return Promise.resolve(user);
};
*/
//*------------------------------------------------ GET USER WITH EMAIL
const getUserWithEmail = (email) => {
  return pool
    .query(`SELECT * FROM users WHERE email = $1`, [email])
    //.then((result) => console.log(result.rows[0]))
    .then((result) => (result.rows[0] || null))
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
/*
const getUserWithId = function(id) {
  return Promise.resolve(users[id]);
};
*/
//*------------------------------------------------ GET USER WITH ID
const getUserWithId = (id) => {
  return pool
    .query(`SELECT * FROM users WHERE id = $1`, [id])
  //.then((result) => console.log(result.rows[0]))
    .then((result) => (result.rows[0]))
    .catch((err) => {
      console.log(err.message);
    });
};

exports.getUserWithId = getUserWithId;

//*------------------------------------------------ ADD USER
/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
/*
const addUser =  function(user) {
  const userId = Object.keys(users).length + 1;
  user.id = userId;
  users[userId] = user;
  return Promise.resolve(user);
};
*/

const addUser = (user) => {
  return pool
    .query(`INSERT INTO users (name, email, password)
  VALUES ($1, $2, $3)
  RETURNING *;`, [user.name, user.email, user.password])
    .then((result) => result.rows[0])
    .catch((err) => {
      console.log(err.message);
    });
};

exports.addUser = addUser;

///!--------------------------------------------------- Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
/*
const getAllReservations = function(guest_id, limit = 10) {
  return getAllProperties(null, 2);
};
*/
const getAllReservations = (guest_id, limit = 10) => {
  return pool
    .query(`SELECT properties.*, reservations.*, AVG(rating) AS average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date DESC
    LIMIT $2`, [guest_id, limit])
    .then((result) => result.rows)
    .catch((err) => {
      console.log(err.message);
    });
};

exports.getAllReservations = getAllReservations;

///!--------------------------------------------------- Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
/*
const getAllProperties = function(options, limit = 10) {
  const limitedProperties = {};
  for (let i = 1; i <= limit; i++) {
    limitedProperties[i] = properties[i];
  }
  return Promise.resolve(limitedProperties);
};
*/

/*
const getAllProperties = (options, limit = 10) => {
  return pool
    .query(`SELECT * FROM properties LIMIT $1`, [limit])
    .then((result) => result.rows)
    .catch((err) => {
      console.log(err.message);
    });
};
*/

const getAllProperties = (options, limit = 10) => {
  // 1 (Setup an array to hold any parameters that may be available for the query)
  const queryParams = [];
  // 2 (Start the query with all information that comes before the WHERE clause)
  let queryString = `
  SELECT properties.*, AVG(property_reviews.rating) AS average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id `;

  // 3 (Check if a city has been passed in as an option. Add the city to the params array and create a WHERE clause for the city)
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    queryParams.push(`%${options.owner_id}%`);
    queryString += `AND owner_id = $${queryParams.length} `;
    if (queryParams.length === 1) {
      queryString += `WHERE owner_id = $${queryParams.length} `;
    } else {
      queryString += `AND owner_id = $${queryParams.length} `;
    }
  }

  if (options.minimum_price_per_night || options.max_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100, options.maximum_price_per_night * 100);
    if (queryParams.length === 2) {
      queryString += `WHERE cost_per_night >= $${queryParams.length - 1} AND cost_per_night <= $${queryParams.length}`;
    } else {
      queryString += `AND cost_per_night >= $${queryParams.length - 1} AND cost_per_night <= $${queryParams.length}`;
    }
  }

  // ADD THE GROUP BY BEFORE HAVING
  queryString += ` GROUP BY properties.id `;


  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += `HAVING AVG(property_reviews.rating) >= $${queryParams.length}`;
  }

  // 4 (Add any query that comes after the WHERE clause)
  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  // 5 (Console log to check correct values are being entered into search)
  console.log(queryString, queryParams);

  // 6 (Run the query)
  return pool.query(queryString, queryParams)
    .then((res) => res.rows)
    .catch((err) => {
      console.log(err.message);
    });
};

exports.getAllProperties = getAllProperties;

//*------------------------------------------------ ADD PROPERTY
/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
/*
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};
*/

//TODO-------------------

/*
const addProperty = function (property) {

};
*/

//Update this function to save a new property to the properties table.



// Property
// {
//   owner_id: int,
//   title: string,
//   description: string,
//   thumbnail_photo_url: string,
//   cover_photo_url: string,
//   cost_per_night: string,
//   street: string,
//   city: string,
//   province: string,
//   post_code: string,
//   country: string,
//   parking_spaces: int,
//   number_of_bathrooms: int,
//   number_of_bedrooms: int
// }

const addProperty = (property) => {
  const queryParams = [
    property.title,
    property.description,
    property.owner_id,
    property.cover_photo_url,
    property.thumbnail_photo_url,
    property.cost_per_night,
    property.parking_spaces,
    property.number_of_bathrooms,
    property.number_of_bedrooms,
    property.city,
    property.country,
    property.province,
    property.street,
    property.post_code
  ];

  let queryString = `
  INSERT INTO properties (
    title, 
    description,
    owner_id,
    cover_photo_url,
    thumbnail_photo_url,
    cost_per_night,
    parking_spaces,
    number_of_bathrooms,
    number_of_bedrooms,
    city,
    country,
    province,
    street,
    post_code
  )
  VALUES( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *;
  `;

  return pool.query(queryString, queryParams)
    .then(res => res.rows);
};
exports.addProperty = addProperty;