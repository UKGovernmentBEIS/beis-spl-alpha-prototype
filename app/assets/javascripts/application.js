/* global $ */

// Warn about using the kit in production
if (window.console && window.console.info) {
  window.console.info('GOV.UK Prototype Kit - do not use for production')
}

const COMPULSORY = 'compulsory'
const MATERNITY = 'maternity'
const PATERNITY = 'paternity'
const SHARED = 'shared'
const ALL_LEAVE_TYPES = [MATERNITY, PATERNITY, SHARED]

const MOTHER = 'mother'
const PARTNER = 'partner'

const DRAGGING = 'dragging'
const NEGATIVE = 'negative'

const MATERNITY_WEEKS_ENTITLEMENT = 52
const PATERNITY_WEEKS_ENTITLEMENT = 2

const $calendar = $('table#leave-calendar')
let toggleAction = null

$(document).ready(function () {
  window.GOVUKFrontend.initAll()

  // Run once to intialize.
  onLeaveUpdated()

  $(`td.${MOTHER}:not(.${COMPULSORY}), td.${PARTNER}`).on('mousedown', function (event) {
    if (event.which !== 1) {
      // Only respond to primary mouse button.
      return
    }
    $calendar.addClass(DRAGGING)
    const $cell = $(this)
    toggleAction = getToggleAction($cell)
    const $row = $cell.parent()
    toggleAction($row)
    event.preventDefault()
  })

  $('tr.leave-week').on('mouseover', function () {
    if (!toggleAction) {
      return
    }
    const $row = $(this)
    toggleAction($row)
  })

  $calendar.on('mouseup mouseleave', function () {
    $calendar.removeClass(DRAGGING)
    toggleAction = null
  })
})

function getToggleAction($cell) {
  const motherOrPartner = $cell.hasClass(MOTHER) ? MOTHER : PARTNER
  const leaveType = getSelectedLeaveType(motherOrPartner)
  const baseAction = $cell.hasClass(leaveType) ? removeLeave : setLeave
  return baseAction.bind(null, leaveType, motherOrPartner)
}

function getSelectedLeaveType(motherOrPartner) {
  const isShared = $('input[name=leave-type]:checked').val() === 'shared'
  if (isShared) {
    return SHARED
  }
  return motherOrPartner === MOTHER ? MATERNITY : PATERNITY
}

function removeLeave(leaveType, motherOrPartner, $row) {
  const $cell = $row.find(`.${motherOrPartner}`)
  if ($cell.hasClass(COMPULSORY)) {
    return
  }
  $cell.removeClass(leaveType)
  onLeaveUpdated()
}

function setLeave(leaveType, motherOrPartner, $row) {
  const $cell = $row.find(`.${motherOrPartner}`)
  ALL_LEAVE_TYPES.forEach(type => removeLeave(type, motherOrPartner, $row))
  $cell.addClass(leaveType)
  onLeaveUpdated()
}

function onLeaveUpdated() {
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
