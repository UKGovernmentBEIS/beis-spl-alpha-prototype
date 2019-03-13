/* global $ */

// Warn about using the kit in production
if (window.console && window.console.info) {
  window.console.info('GOV.UK Prototype Kit - do not use for production')
}

let useSmartPlanner = true

const COMPULSORY = 'compulsory'
const MATERNITY = 'maternity'
const PATERNITY = 'paternity'
const SHARED = 'shared'
const LEAVE = 'leave'
const ALL_LEAVE_TYPES = [MATERNITY, PATERNITY, SHARED, LEAVE]

const MOTHER = 'mother'
const PARTNER = 'partner'

const DRAGGING = 'dragging'
const NEGATIVE = 'negative'

const MATERNITY_WEEKS_ENTITLEMENT = 52
const PATERNITY_WEEKS_ENTITLEMENT = 2

const $calendar = $('table#leave-calendar')

$(document).ready(function () {
  window.GOVUKFrontend.initAll()

  if (!useSmartPlanner) {
    $('.type-of-leave').show()
  }

  // Run once to intialize.
  onLeaveUpdated()

  $(`td.${MOTHER}:not(.${COMPULSORY}), td.${PARTNER}`).on('mousedown', function (event) {
    if (event.which !== 1) {
      // Only respond to primary mouse button.
      return
    }

    $calendar.addClass(DRAGGING)
    event.preventDefault()

    const $originalCell = $(this)
    const column = $originalCell.hasClass(MOTHER) ? MOTHER : PARTNER
    const leaveType = getSelectedLeaveType(column)
    const cellAction = $originalCell.hasClass(leaveType) ? removeLeave : addLeave
    const onRowMouseOver = function () {
      const $cellInRow = $(this).find(`.${column}`)
      if ($cellInRow.hasClass(COMPULSORY)) {
        return
      }
      cellAction($cellInRow, leaveType)
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

function getSelectedLeaveType(column) {
  if (useSmartPlanner) {
    return LEAVE
  }
  const isShared = $('input[name=leave-type]:checked').val() === 'shared'
  if (isShared) {
    return SHARED
  }
  return column === MOTHER ? MATERNITY : PATERNITY
}

function addLeave($cell, leaveType) {
  ALL_LEAVE_TYPES.forEach(type => removeLeave($cell, type))
  $cell.addClass(leaveType)
}

function removeLeave($cell, leaveType) {
  $cell.removeClass(leaveType)
}

function onLeaveUpdated() {
  if (useSmartPlanner) {
    applyLeave()
  }

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

  const hasMaternityGap = hasGap(maternity)
  const hasSharedGap = hasGap(motherShared) || hasGap(partnerShared)
  const hasPaternityGap = hasGap(paternity)

  const paternityOutOfRange = paternity.filter(function () {
    const week = getWeekNumber($(this))
    return week < 0 || week > 7
  }).length !== 0

  const firstMaternity = getWeekNumber(maternity.first())
  const firstShared = getWeekNumber(shared.first())

  $('#maternity-gap').toggle(hasMaternityGap)
  $('#maternity-maximum').toggle(remainingWeeks < 0)
  $('#no-more-shared').toggle(remainingWeeks <= 0)
  $('#can-break-shared').toggle(sharedWeeks > 0 && !hasSharedGap)
  $('#paternity-gap').toggle(hasPaternityGap)
  $('#paternity-maximum').toggle(paternityWeeks > PATERNITY_WEEKS_ENTITLEMENT)
  $('#paternity-period').toggle(paternityOutOfRange)
  $('#shared-before-maternity').toggle(firstShared < firstMaternity)
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
    if ($this.hasClass(COMPULSORY)) {
      hasStartedMaternityLeave = true
      $this.addClass(MATERNITY)
    } else if ($this.hasClass(LEAVE)) {
      const weekNumber = getWeekNumber($this)
      hasStartedMaternityLeave = true
      $this.addClass(weekNumber < 0 || !hasFinishedMaternityLeave ? MATERNITY : SHARED)
    } else if (hasStartedMaternityLeave) {
      hasFinishedMaternityLeave = true
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
