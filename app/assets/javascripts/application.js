/* global $ */

// Warn about using the kit in production
if (window.console && window.console.info) {
  window.console.info('GOV.UK Prototype Kit - do not use for production')
}

const COMPULSORY = 'compulsory'
const MATERNITY = 'maternity'
const PATERNITY = 'paternity'
const SHARED = 'shared'
const LEAVE = 'leave'

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

  // Run once to intialize.
  onLeaveUpdated()

  $(`td.${MOTHER}, td.${PARTNER}`).on('mousedown', function (event) {
    if (event.which !== 1) {
      // Only respond to primary mouse button.
      return
    }

    const $originalCell = $(this)

    if ($originalCell.hasClass(DISABLED)) {
      return
    }

    if ($originalCell.hasClass(MOTHER) && $originalCell.hasClass(BEFORE_BIRTH_WEEK)) {
      handleMaternityBeforeBirthWeek($originalCell)
      return
    }

    event.preventDefault()
    $calendar.addClass(DRAGGING)

    const column = $originalCell.hasClass(MOTHER) ? MOTHER : PARTNER
    const addOrRemoveLeave = $originalCell.hasClass(LEAVE) ? removeLeave : addLeave
    const onRowMouseOver = function () {
      const $cellInRow = $(this).find(`.${column}`)
      if ($cellInRow.hasClass(DISABLED)) {
        return
      }
      addOrRemoveLeave($cellInRow)
      onLeaveUpdated()
    }

    onRowMouseOver.call($originalCell.parent())

    const $leaveWeeks = $('tr.leave-week')
    $leaveWeeks.on('mouseover', onRowMouseOver)
    $calendar.one('mouseup mouseleave', function () {
      $leaveWeeks.off('mouseover', onRowMouseOver)
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
  const $beforeBirthWeek = $(`.${MOTHER}.${BEFORE_BIRTH_WEEK}`)
  if ($cell.hasClass(LEAVE)) {
    $beforeBirthWeek.each(function () {
      const $this = $(this)
      if (getWeekNumber($this) <= weekNumber) {
        $this.removeClass(LEAVE)
      }
    })
  } else {
    $beforeBirthWeek.each(function () {
      const $this = $(this)
      if (getWeekNumber($this) >= weekNumber) {
        $this.addClass(LEAVE)
      }
    })
  }
  onLeaveUpdated()
}

function addLeave($cell,) {
  $cell.addClass(LEAVE)
}

function removeLeave($cell) {
  $cell.removeClass(LEAVE)
}

function onLeaveUpdated() {
  applyLeave()

  const shared = $(`td.${SHARED}`)
  const motherShared = $(`td.${MOTHER}.${SHARED}`)
  const partnerShared = $(`td.${PARTNER}.${SHARED}`)
  const maternity = $(`td.${MOTHER}.${MATERNITY}`)
  const paternity = $(`td.${PARTNER}.${PATERNITY}`)

  const sharedWeeks = shared.length
  const maternityWeeks = maternity.length
  const remainingWeeks = MATERNITY_WEEKS_ENTITLEMENT - maternityWeeks - sharedWeeks
  const paternityWeeks = paternity.length

  // Remaining weeks.
  $('#shared-weeks').text(sharedWeeks)
  $('#maternity-weeks').text(maternityWeeks)
  $('#remaining-weeks').text(remainingWeeks)
  $('#paternity-weeks').text(paternityWeeks)
  $('.remaining-total').toggleClass(NEGATIVE, remainingWeeks < 0)

  // Warnings.
  $('#maternity-maximum').toggle(remainingWeeks < 0)
  $('#no-more-shared').toggle(remainingWeeks <= 0)
  $('#can-break-shared').toggle(sharedWeeks > 0 && !(hasGap(motherShared) || hasGap(partnerShared)))

  // Form values.
  $('#mother-shared').val(motherShared.length)
  $('#partner-shared').val(partnerShared.length)
}

function hasGap(weeks) {
  const firstWeek = getWeekNumber(weeks.first())
  const lastWeek = getWeekNumber(weeks.last())
  const totalWeeks = weeks.length
  return lastWeek - firstWeek >= totalWeeks
}

function getWeekNumber($cell) {
  return parseInt($cell.data('week'))
}

function applyLeave() {
  applyMothersLeave()
  applyPartnersLeave()
}

function applyMothersLeave() {
  let hasStartedMaternityLeave = false
  let hasFinishedMaternityLeave = false
  $(`.${MOTHER}`).removeClass(SHARED).removeClass(MATERNITY).each(function () {
    const $this = $(this)
    const weekNumber = getWeekNumber($this)
    if ($this.hasClass(COMPULSORY)) {
      hasStartedMaternityLeave = true
      $this.addClass(MATERNITY)
    } else if ($this.hasClass(LEAVE)) {
      hasStartedMaternityLeave = true
      $this.addClass(weekNumber < 0 || !hasFinishedMaternityLeave ? MATERNITY : SHARED)
    } else if (hasStartedMaternityLeave) {
      if (weekNumber < 0) {
        $this.addClass(LEAVE)
        $this.addClass(MATERNITY)
      } else {
        hasFinishedMaternityLeave = true
      }
    }
  })
}

function applyPartnersLeave() {
  let hasStartedPaternityLeave = false
  let hasFinishedPaternityLeave = false
  let paternityLeaveUsed = 0
  $(`.${PARTNER}`).removeClass(SHARED).removeClass(PATERNITY).each(function () {
    const $this = $(this)
    if ($this.hasClass(LEAVE)) {
      const weekNumber = getWeekNumber($this)
      const inFirstEightWeeks = 0 <= weekNumber && weekNumber < 8
      const hasEntitlementRemaining = paternityLeaveUsed < PATERNITY_WEEKS_ENTITLEMENT
      const canUsePaternityLeave = inFirstEightWeeks && !hasFinishedPaternityLeave && hasEntitlementRemaining
      if (canUsePaternityLeave) {
        hasStartedPaternityLeave = true
        paternityLeaveUsed++
        $this.addClass(PATERNITY)
      } else {
        $this.addClass(SHARED)
      }
    } else if (hasStartedPaternityLeave) {
      hasFinishedPaternityLeave = true
    }
  })
}
