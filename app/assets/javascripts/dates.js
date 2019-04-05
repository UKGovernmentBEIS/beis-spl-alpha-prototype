const moment = require('moment')

function convertToMoment (year, month, day) {
  return moment([year, month, day].join('-'), 'YYYY-MM-DD')
}

module.exports = {
  providedDate: function (year, month, day) {
    // if birth-parents => due date, if adopters => match date
    return convertToMoment(year, month, day).format("YYYY-MM-DD");
  },

  qualifyingWeek: function (year, month, day, isAdoption) {
    const startOfWeekProvided = convertToMoment(year, month, day).startOf('week');
    const qualifyingWeek = isAdoption ? startOfWeekProvided : startOfWeekProvided.subtract(105, 'days');
    return qualifyingWeek.format("YYYY-MM-DD")
  },

  twentySixWeeksBeforeQualifying: function(year, month, day, isAdoption) {
    const startOfQualifyingWeek = moment(this.qualifyingWeek(...arguments));
    const startOfTwentySixthWeek = startOfQualifyingWeek.subtract(182, 'days')
    return startOfTwentySixthWeek.format("YYYY-MM-DD")
  },

  eightWeeksBeforeQualifying: function(year, month, day, isAdoption) {
    const startOfQualifyingWeek = moment(this.qualifyingWeek(...arguments));
    const startOfEighthWeek = startOfQualifyingWeek.subtract(56, 'days')
    return startOfEighthWeek.format("YYYY-MM-DD")
  },

  sixtySixWeeksBeforeDueDate: function(year, month, day) {
    const startOfDueWeek = moment(this.providedDate(...arguments));
    const startOfSixtySixthWeek = startOfDueWeek.subtract(462, 'days')
    return startOfSixtySixthWeek.format("YYYY-MM-DD")
  }
}