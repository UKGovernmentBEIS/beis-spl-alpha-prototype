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
const ALL_LEAVE_TYPES = [MATERNITY, PATERNITY, SHARED, LEAVE]

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
  window.toggleSmartPlanner(true);

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

    if (window.useSmartPlanner && $originalCell.hasClass(MOTHER) && $originalCell.hasClass(BEFORE_BIRTH_WEEK)) {
      handleMaternityBeforeBirthWeek($originalCell)
      return
    }

    event.preventDefault()
    $calendar.addClass(DRAGGING)

    const column = $originalCell.hasClass(MOTHER) ? MOTHER : PARTNER
    const leaveType = getSelectedLeaveType(column)
    const cellAction = $originalCell.hasClass(leaveType) ? removeLeave : addLeave
    const onRowMouseOver = function () {
      const $cellInRow = $(this).find(`.${column}`)
      if ($cellInRow.hasClass(DISABLED)) {
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

window.toggleSmartPlanner = function (use) {
  window.useSmartPlanner = use
  $('.smart-planner-show').toggle(use)
  $('.smart-planner-hide').toggle(!use)
  if (use) {
    onLeaveUpdated()
  }
}

window.addEventListener('keydown', function (event) {
  const option = Number(event.key)
  if (option === 1) {
    window.toggleSmartPlanner(false)
  } else if (option === 2) {
    window.toggleSmartPlanner(true)
  }
})

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

function getSelectedLeaveType(column) {
  if (window.useSmartPlanner) {
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
  $cell.addClass(LEAVE)
  $cell.addClass(leaveType)
}

function removeLeave($cell, leaveType) {
  if (!$cell.hasClass(leaveType)) {
    return
  }
  $cell.removeClass(LEAVE)
  $cell.removeClass(leaveType)
}

function onLeaveUpdated() {
  if (window.useSmartPlanner) {
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
  $('#maternity-gap').toggle(hasGap(maternity))
  $('#maternity-maximum').toggle(remainingWeeks < 0)
  $('#no-more-shared').toggle(remainingWeeks <= 0)
  $('#can-break-shared').toggle(sharedWeeks > 0 && !(hasGap(motherShared) || hasGap(partnerShared)))
  $('#paternity-gap').toggle(hasGap(paternity))
  $('#paternity-maximum').toggle(paternityWeeks > PATERNITY_WEEKS_ENTITLEMENT)
  $('#shared-before-maternity').toggle(getWeekNumber(shared.first()) < getWeekNumber(maternity.first()))
  $('#paternity-period').toggle(getWeekNumber(paternity.last()) > 7)
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
