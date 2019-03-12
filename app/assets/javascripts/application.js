/* global $ */

// Warn about using the kit in production
if (window.console && window.console.info) {
  window.console.info('GOV.UK Prototype Kit - do not use for production')
}

const SHARED = 'shared'
const NOT_SHARED = 'not-shared'
const ALL_LEAVE_TYPES = [SHARED, NOT_SHARED]

const MATERNITY_WEEKS_ENTITLEMENT = 52
const PATERNITY_WEEKS_ENTITLEMENT = 2

let isMouseDown = false
let toggleAction = null

$(document).ready(function () {
  window.GOVUKFrontend.initAll()

  onLeaveUpdated()

  $('td.mother:not(.compulsory-maternity), td.partner').mousedown(function (e) {
    // Only respond to primary mouse button.
    if (e.which === 1) {
      const $this = $(this)
      toggleAction = getToggleAction($this)
      toggleAction($this)
    }
    return false
  }).mouseover(function () {
    if (toggleAction) {
      const $this = $(this)
      toggleAction($this)
    }
  })

  $(document).mouseup(function () {
    toggleAction = null
  }).mouseleave(function () {
    toggleAction = null
  })
})

function getToggleAction($cell) {
  const selectedLeaveType = $('input[name=leave-type]:checked').val()
  const hasClass = $cell.hasClass(selectedLeaveType)
  if (hasClass) {
    return removeLeave.bind(undefined, selectedLeaveType)
  } else {
    return setLeave.bind(undefined, selectedLeaveType)
  }
}

function removeLeave(leaveType, $cell) {
  $cell.removeClass(leaveType)
  onLeaveUpdated()
}

function setLeave(leaveType, $cell) {
  ALL_LEAVE_TYPES.forEach(type => removeLeave(type, $cell))
  $cell.addClass(leaveType)
  onLeaveUpdated()
}

function onLeaveUpdated() {
  const motherShared = $('td.mother.shared')
  const partnerShared = $('td.partner.shared')
  const shared = $('td.shared')
  const sharedWeeks = shared.length
  const maternity = $('td.mother.not-shared')
  const maternityWeeks = maternity.length
  const paternity = $('td.partner.not-shared')
  const paternityWeeks = paternity.length
  const remainingWeeks = MATERNITY_WEEKS_ENTITLEMENT - maternityWeeks - sharedWeeks

  $('#shared-weeks').text(sharedWeeks)
  $('#maternity-weeks').text(maternityWeeks)
  $('#paternity-weeks').text(paternityWeeks)
  $('#remaining-weeks').text(remainingWeeks)
  if (remainingWeeks >= 0) {
    $('.remaining-total').removeClass('negative')
  } else {
    $('.remaining-total').addClass('negative')
  }

  const hasMaternityGap = hasGap(maternity)
  const hasSharedGap = hasGap(motherShared) || hasGap(partnerShared)
  const hasPaternityGap = hasGap(paternity)

  const paternityOutOfRange = paternity.filter(function () {
    const week = getWeek($(this))
    return week < 0 || week > 7
  }).length !== 0

  const firstMaternity = getWeek(maternity.first())
  const firstMotherShared = getWeek(shared.first())

  setVisibility('maternity-gap', hasMaternityGap)
  setVisibility('maternity-maximum', remainingWeeks < 0)
  setVisibility('no-more-shared', remainingWeeks <= 0)
  setVisibility('can-break-shared', sharedWeeks > 0 && !hasSharedGap)
  setVisibility('paternity-gap', hasPaternityGap)
  setVisibility('paternity-maximum', paternityWeeks > PATERNITY_WEEKS_ENTITLEMENT)
  setVisibility('paternity-period', paternityOutOfRange)
  setVisibility('shared-before-maternity', firstMotherShared < firstMaternity)
}

function hasGap(leaveCells) {
  const firstWeek = getWeek(leaveCells.first())
  const lastWeek = getWeek(leaveCells.last())
  const totalWeeks = leaveCells.length
  return lastWeek - firstWeek >= totalWeeks
}

function setVisibility(elementId, isVisible) {
  const $element = $(`#${elementId}`)
  if (isVisible) {
    $element.show()
  } else {
    $element.hide()
  }
}

function getWeek($cell) {
  return parseInt($cell.data('week'))
}
