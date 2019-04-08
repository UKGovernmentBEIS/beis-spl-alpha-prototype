const moment = require('moment')

module.exports = function (env) {
  /**
   * Instantiate object used to store the methods registered as a
   * 'filter' (of the same name) within nunjucks. You can override
   * gov.uk core filters by creating filter methods of the same name.
   * @type {Object}
   */
  var filters = {}

  /* ------------------------------------------------------------------
    add your methods to the filters obj below this comment block:
    @example:

    filters.sayHi = function(name) {
        return 'Hi ' + name + '!'
    }

    Which in your templates would be used as:

    {{ 'Paul' | sayHi }} => 'Hi Paul'

    Notice the first argument of your filters method is whatever
    gets 'piped' via '|' to the filter.

    Filters can take additional arguments, for example:

    filters.sayHi = function(name,tone) {
      return (tone == 'formal' ? 'Greetings' : 'Hi') + ' ' + name + '!'
    }

    Which would be used like this:

    {{ 'Joel' | sayHi('formal') }} => 'Greetings Joel!'
    {{ 'Gemma' | sayHi }} => 'Hi Gemma!'

    For more on filters and how to write them see the Nunjucks
    documentation.

  ------------------------------------------------------------------ */

  filters.startOfWeek = function (date) {
    return moment(date).startOf('week')
  }

  filters.offsetWeeks = function (date, weekOffset) {
    return moment(date).add(weekOffset, 'weeks')
  }

  filters.formatDate = function (date, format) {
    return moment(date).format(format)
  }

  filters.twoDigit = function (number) {
    if (isNaN(number)) {
      return '00'
    }
    return ('0' + number).slice(-2)
  }

  filters.totalWeeks = function (end, start) {
    return Math.abs(moment(end).diff(start, 'weeks')) + 1
  }

  filters.lineIfNotEmpty = function (line, endOfLine) {
    return line && line.trim() !== '' ? line + endOfLine : ''
  }

  filters.pay = function (amount) {
    return `£${parseFloat(amount).toFixed(2)}`
  }

  filters.getStartDateTitle = function (adoptionOrBirth) {
    if (adoptionOrBirth === 'birth') {
      return "When is the baby due, or when was the baby born?"
    } else if (adoptionOrBirth === 'adoption') {
      return "When is or was your match date?"
    }
  }

  filters.getEligibilityForResults = function (eligibility) {
    switch (eligibility) {
      case true:
        return "Eligible ✔"
      break;
      case false:
        return "Not eligible ✘"
        break;
      case undefined:
        return "Eligibility unknown"
        break;
      default:
        console.log('unknown eligibility')
    }
  }

  filters.capitalize = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  filters.currentParentName= function(data) {
    return data[`${data['current-parent']}-name`]
  }

  filters.otherParentName = function(data) {
    const otherParent = data['current-parent'] === 'primary' ? 'secondary' : 'primary'
    return data[`${otherParent}-name`]
  }

  filters.getTotalWeeklyPay = function (payBlock) {
    const motherPay = parseFloat(payBlock.mother.substring(1))
    const partnerPay = parseFloat(payBlock.partner.substring(1))
    return '£' + (motherPay + partnerPay).toFixed(2)
  }

  /* ------------------------------------------------------------------
    keep the following line to return your filters to the app
  ------------------------------------------------------------------ */
  return filters
}
