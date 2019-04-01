const moment = require('moment')

module.exports = {
  validateDueDate: function(year, month, day) {
    const errorMessages = []
    const dueDate = moment([year, month, day].join('-'), 'YYYY-MM-DD')
    
    if (dueDate.invalidAt() === 2 || day.length === 0 || day.length > 2) {
      errorMessages.push("Day must be valid")
    }
    
    if (dueDate.invalidAt() === 1 || month.length === 0 || month.length > 2) {
      errorMessages.push("Month must be valid")
    }
    
    if (dueDate.invalidAt() === 0) {
      errorMessages.push("Year must be valid")
    } else if (year.length !== 4) {
      errorMessages.push("Year must be in 4 digit form")
    }
    
    const earliestPermitted = moment().subtract(1, 'year')
    const latestPermitted = moment().add(1, 'year')
    if(!dueDate.isBetween(earliestPermitted, latestPermitted)) {
      errorMessages.push("Due date must be within 1 year of today")
    }

    errorMessage = errorMessages.join('. ')
    
    return errorMessage.length > 0 ? errorMessage + '.' : errorMessage
  }
}