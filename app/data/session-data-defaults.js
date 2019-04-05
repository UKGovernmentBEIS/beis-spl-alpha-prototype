/*

Provide default values for user session data. These are automatically added
via the `autoStoreData` middleware. Values will only be added to the
session if a value doesn't already exist. This may be useful for testing
journeys where users are returning or logging in to an existing application.

============================================================================

Example usage:

"full-name": "Sarah Philips",

"options-chosen": [ "foo", "bar" ]

============================================================================

*/

module.exports = {
  // Insert values here
  "due-date-day": "05",
  "due-date-month": "09",
  "due-date-year": "2019",
  'birth-or-adoption': 'adoption',
  'primary-name': 'primary adopter',
  'secondary-name': 'primary adopter’s partner'
}
