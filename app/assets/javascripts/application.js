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

const MATERNITY_LEAVE_WEEKS = 52
const INITIAL_MATERNITY_PAY_WEEKS = 6
const MATERNITY_PAY_WEEKS = 39
const PATERNITY_LEAVE_WEEKS = 2
const PATERNITY_PAY_WEEKS = 2

const $calendar = $('table#leave-calendar')

$(document).ready(function () {
  window.GOVUKFrontend.initAll()

  const parents = [MOTHER, PARTNER]
  parents.forEach(function (parent) {
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

    const $originalRow = $originalCell.parent()
    const column = $originalCell.hasClass(MOTHER) ? MOTHER : PARTNER
    const addOrRemoveLeave = hasLeave($originalCell) ? removeLeave : addLeave
    const onRowMouseOver = function () {
      const $row = $(this)
      const isForward = getWeekNumber($row) >= getWeekNumber($originalRow)
      const $rowsBetween = isForward ? $originalRow.nextUntil($row.next()) : $originalRow.prevUntil($row.prev())
      $rowsBetween.add($originalRow).each(function () {
        const $cellInRow = $(this).find('.' + column)
        if ($cellInRow.hasClass(DISABLED)) {
          return
        }
        addOrRemoveLeave($cellInRow)
      })
      onLeaveUpdated()
    }

    // Handle row that was clicked on.
    onRowMouseOver.call($originalRow)

    const $weeks = $('tr.week')
    $weeks.on('mouseover', onRowMouseOver)
    $calendar.one('mouseup mouseleave', function () {
      $weeks.off('mouseover', onRowMouseOver)
      $calendar.removeClass(DRAGGING)
    })
  })

  $('input#show-statutory-pay').on('change', function () {
    const checked = $(this).prop('checked')
    $calendar.toggleClass('show-pay', checked)
    $('.pay-only').toggle(checked)
  }).change()

  $('.leave-example').on('click', function () {
    const $this = $(this)
    const motherLeave = $this.data('mother-leave').split(',').map(function (n) { return parseInt(n) })
    const partnerLeave = $this.data('partner-leave').split(',').map(function (n) { return parseInt(n) })
    const warning = 'This will overwrite any leave that you have already entered on the calendar.'
    if ($('.mother-leave').length + $('.partner-leave').length > 2 && !confirm(warning)) {
      return
    }
    $('.mother').each(function () {
      const $cell = $(this)
      const weekNumber = getWeekNumber($cell)
      toggleLeave($cell, motherLeave.indexOf(weekNumber) !== -1)
    })
    $('.partner').each(function () {
      const $cell = $(this)
      const weekNumber = getWeekNumber($cell)
      toggleLeave($cell, partnerLeave.indexOf(weekNumber) !== -1)
    })
    onLeaveUpdated()
    $calendar[0].scrollIntoView(true)
  })
})

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

function toggleLeave($cell, isLeave) {
  const $input = $cell.find('input')
  $input.prop('checked', isLeave)
  $input.change()
}

function hasLeave($cell) {
  return $cell.find('input').prop('checked')
}

function getWeekNumber($cellOrRow) {
  const $row = $cellOrRow.prop('tagName') === 'TR' ? $cellOrRow : $cellOrRow.parent()
  return parseInt($row.data('week'))
}

function onLeaveUpdated() {
  const maternityWeeks = $('.maternity-leave:visible').length
  const mothersSplWeeks = $('.' + MOTHER + ' .shared-parental-leave:visible').length
  const partnersSplWeeks = $('.' + PARTNER + ' .shared-parental-leave:visible').length
  const paternityWeeks = $('.paternity-leave:visible').length

  const maternitySplRemainingWeeks = MATERNITY_LEAVE_WEEKS - maternityWeeks - mothersSplWeeks - partnersSplWeeks
  const paternityRemainingWeeks = PATERNITY_LEAVE_WEEKS - paternityWeeks

  // Last leave week (for labelling gaps).
  $('.week').removeClass('last-mother-leave').removeClass('last-partner-leave')
  $('.mother-leave').last().addClass('last-mother-leave')
  $('.partner-leave').last().addClass('last-partner-leave')

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

  // Save / share link.
  $('#save-share-link').val(getSaveLink())

  // Pay.
  updatePay()
}

function updatePay() {
  $('.with-initial-maternity-pay').removeClass('with-initial-maternity-pay')
  $('.with-statutory-pay').removeClass('with-statutory-pay')
  $('.with-unpaid').removeClass('with-unpaid')

  const $maternityWeeks = $('.maternity-leave:visible')
  $maternityWeeks.slice(0, INITIAL_MATERNITY_PAY_WEEKS).parent().addClass('with-initial-maternity-pay')
  $maternityWeeks.slice(INITIAL_MATERNITY_PAY_WEEKS, MATERNITY_PAY_WEEKS).parent().addClass('with-statutory-pay')
  $maternityWeeks.slice(MATERNITY_PAY_WEEKS).parent().addClass('with-unpaid')

  const remainingPayWeeks = Math.max(MATERNITY_PAY_WEEKS - $maternityWeeks.length, 0)
  const $splWeeks = $('.shared-parental-leave:visible')
  $splWeeks.slice(0, remainingPayWeeks).parent().addClass('with-statutory-pay')
  $splWeeks.slice(remainingPayWeeks).parent().addClass('with-unpaid')

  const $paternityWeeks = $('.paternity-leave:visible')
  $paternityWeeks.slice(0, PATERNITY_PAY_WEEKS).parent().addClass('with-statutory-pay')
  $paternityWeeks.slice(PATERNITY_PAY_WEEKS).parent().addClass('with-unpaid')
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
