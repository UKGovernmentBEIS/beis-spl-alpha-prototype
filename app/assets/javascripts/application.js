/* global $, utils */

// Warn about using the kit in production
if (window.console && window.console.info) {
  window.console.info('GOV.UK Prototype Kit - do not use for production')
}

const MOTHER = 'mother'
const PARTNER = 'partner'

const BEFORE_BIRTH_WEEK = 'before-birth-week'
const DISABLED = 'disabled'
const DRAGGING = 'dragging'
const NEGATIVE = 'negative'

const MATERNITY_WEEKS_ENTITLEMENT = 52
const PATERNITY_WEEKS_ENTITLEMENT = 2

const $calendar = $('table#leave-calendar')

$(document).ready(function () {
  window.GOVUKFrontend.initAll()

  if ($calendar.length > 0) {
    scrollToBirthWeek()
  }

  [MOTHER, PARTNER].forEach(function (parent) {
    $('.' + parent + '-leave-input').on('change', function () {
      const $this = $(this)
      const $row = $(this).closest('tr')
      $row.toggleClass(parent + '-leave', $this.prop('checked'))
    }).change() // Initialize.
  })

  // Run once to intialize.
  onLeaveUpdated()

  $('input[class$="-leave-input"] + label').on('click', function (event) {
    event.preventDefault()
  }).on('mousedown', function (event) {
    if (event.which !== 1) {
      // Only respond to primary mouse button.
      return
    }

    const $originalCell = $(this).closest('td')
    if ($originalCell.hasClass(DISABLED)) {
      return
    }

    event.preventDefault()

    if ($originalCell.hasClass(MOTHER) && getWeekNumber($originalCell) < 0) {
      handleMaternityBeforeBirthWeek($originalCell)
      return
    }

    $calendar.addClass(DRAGGING)

    const column = $originalCell.hasClass(MOTHER) ? MOTHER : PARTNER
    const addOrRemoveLeave = hasLeave($originalCell) ? removeLeave : addLeave
    const onRowMouseOver = function () {
      const $cellInRow = $(this).find('.' + column)
      if ($cellInRow.hasClass(DISABLED)) {
        return
      }
      addOrRemoveLeave($cellInRow)
      onLeaveUpdated()
    }

    // Handle row that was clicked on.
    onRowMouseOver.call($originalCell.parent())

    const $weeks = $('tr.week')
    $weeks.on('mouseover', onRowMouseOver)
    $calendar.one('mouseup mouseleave', function () {
      $weeks.off('mouseover', onRowMouseOver)
      $calendar.removeClass(DRAGGING)
    })
  })
})

function scrollToBirthWeek() {
  const $scrollContainer = $('#leave-calendar-container')
  const calendarTop = $calendar.position().top
  const birthWeekTop = $calendar.find('.birth-week').position().top
  const headerHeight = $calendar.find('.govuk-table__header').outerHeight()
  const rowHeight = $calendar.find('.govuk-table__row').outerHeight()
  $scrollContainer.scrollTop(birthWeekTop - calendarTop - headerHeight - rowHeight * 1.5)
}

function handleMaternityBeforeBirthWeek($cell) {
  const weekNumber = getWeekNumber($cell)
  const $beforeBirthWeek = $('.' + BEFORE_BIRTH_WEEK + ' .' + MOTHER)
  if (hasLeave($cell)) {
    // Remove leave from this week and all previous weeks.
    $beforeBirthWeek.each(function () {
      const $this = $(this)
      if (getWeekNumber($this) <= weekNumber) {
        removeLeave($this)
      }
    })
  } else {
    // Add leave to week and all weeks up to birth week.
    $beforeBirthWeek.each(function () {
      const $this = $(this)
      if (getWeekNumber($this) >= weekNumber) {
        addLeave($this)
      }
    })
  }
  onLeaveUpdated()
}

function addLeave($cell) {
  toggleLeave($cell, true)
}

function removeLeave($cell) {
  toggleLeave($cell, false)
}

function toggleLeave($cell, checked) {
  const $input = $cell.find('input')
  $input.prop('checked', checked)
  $input.change()
}

function hasLeave($cell) {
  return $cell.find('input').prop('checked')
}

function getWeekNumber($cell) {
  return parseInt($cell.data('week'))
}

function onLeaveUpdated() {
  const maternityWeeks = $('.maternity-leave:visible').length
  const mothersSplWeeks = $('.' + MOTHER + ' .shared-parental-leave:visible').length
  const partnersSplWeeks = $('.' + PARTNER + ' .shared-parental-leave:visible').length
  const paternityWeeks = $('.paternity-leave:visible').length

  const maternitySplRemainingWeeks = MATERNITY_WEEKS_ENTITLEMENT - maternityWeeks - mothersSplWeeks - partnersSplWeeks
  const paternityRemainingWeeks = PATERNITY_WEEKS_ENTITLEMENT - paternityWeeks

  // Remaining weeks.
  $('#maternity-weeks').text(toWeeksString(maternityWeeks))
  $('#mothers-spl-weeks').text(toWeeksString(mothersSplWeeks))
  $('#partners-spl-weeks').text(toWeeksString(partnersSplWeeks))
  $('#maternity-spl-remaining-weeks').text(toWeeksString(maternitySplRemainingWeeks))
  $('.maternity-spl-remaining-total').toggleClass(NEGATIVE, maternitySplRemainingWeeks < 0)

  $('#paternity-weeks').text(toWeeksString(paternityWeeks))
  $('#paternity-remaining-weeks').text(toWeeksString(paternityRemainingWeeks))

  // Warnings.
  $('#maternity-maximum').toggle(maternitySplRemainingWeeks < 0)
  $('#no-more-shared').toggle(maternitySplRemainingWeeks <= 0)
}

function toWeeksString(numberOfWeeks) {
  return numberOfWeeks + ' week' + (numberOfWeeks === 1 ? '' : 's')
}

function getSaveLink() {
  const dueDate = $('input[name="due-date"]').val()
  const weeks = $('.week').map(function () {
    const $this = $(this)
    return {
      mother: hasLeave($this.find('.' + MOTHER)),
      partner: hasLeave($this.find('.' + PARTNER))
    }
  })
  const encodedWeeks = utils.encodeWeeks(weeks.toArray())
  return location.protocol + '//' + location.host + location.pathname + '?s=' + dueDate + '-' + encodedWeeks
}
