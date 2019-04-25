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

  filters.endOfWeek = function (date) {
    return moment(date).endOf('week')
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

  filters.isInPast = function (date) {
    return moment(date).isBefore(moment(), 'day')
  }

  filters.isBirth = function (data) {
    return data['birth-or-adoption'] === 'birth'
  }

  filters.isAdoption = function (data) {
    return data['birth-or-adoption'] === 'adoption'
  }

  filters.getLeaveBlockTableRows = function (leaveBlocks) {
    return leaveBlocks.map(block => [
        {
          text: block.weeks + ' weeks'
        },
        {
          text: block['percent-of-salary'] + '% of salary'
        }
      ]
    )
  }

  filters.toWeekItems = function (range, dueDate, parent) {
    const birthWeek = filters.startOfWeek(dueDate)
    return range.map(i => {
      const date = filters.offsetWeeks(birthWeek, parseInt(i))
      const value = filters.formatDate(date, 'YYYY-MM-DD')
      return {
        text: `${filters.formatDate(date, 'D MMMM YYYY')} to ${filters.formatDate(moment(date).endOf('week'), 'D MMMM YYYY')}`,
        value: value,
        conditional: {
          html:
          `<div class="govuk-checkboxes">
            <div class="govuk-checkboxes__item">
              <input class="govuk-checkboxes__input" id="${parent}-pay-v2-${i}" name="[pay-v2][${parent}]" type="checkbox" value="${value}">
              <label class="govuk-label govuk-checkboxes__label" for="${parent}-pay-v2-${i}">
                Paid
              </label>
            </div>
          </div>`
        }
      }
    })
  }

  filters.getNoticeLeaveBlocksTableRows = function (noticeLeaveBlocks) {
    return noticeLeaveBlocks.map(block => {
      return [
        {
          text: filters.formatDate(block['start'], "DD MMMM YYYY")
        },
        {
          text: filters.formatDate(block['end'], "DD MMMM YYYY")
        },
        {
          text: filters.capitalize(block['binding'])
        },
        {
          text: "Remove"
        }
      ]
    })
  }

  filters.currentParentTakingSpl = function(data) {
    const parent = data['current-parent'] === 'primary' ? 'mother' : 'partner'
    if (data[`${parent}s-spl-blocks`]) {
      return data[`${parent}s-spl-blocks`].length > 0
    }
    return false
  }

  filters.currentParentTakingShpp = function (data) {
    const parent = data['current-parent'] === 'primary' ? 'mother' : 'partner'
    if (data['payBlocks']) {
      return data['payBlocks'].some(block => {
        return (block[parent] && block[parent] !== '£0')
      })
    }
    return false
  }
  /* ------------------------------------------------------------------
    keep the following line to return your filters to the app
  ------------------------------------------------------------------ */
  return filters
}
