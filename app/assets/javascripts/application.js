/* global $ */

// Warn about using the kit in production
if (window.console && window.console.info) {
  window.console.info('GOV.UK Prototype Kit - do not use for production')
}

const SHARED = 'shared'
const NOT_SHARED = 'not-shared'
const ALL_LEAVE_TYPES = [SHARED, NOT_SHARED]

const TOTAL_WEEKS_LEAVE = 52

let isMouseDown = false
let toggleAction = null

$(document).ready(function () {
  window.GOVUKFrontend.initAll()

  updateWeeksTotals()

  $('td.mother, td.partner').mousedown(function (e) {
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
  updateWeeksTotals()
}

function setLeave(leaveType, $cell) {
  ALL_LEAVE_TYPES.forEach(type => removeLeave(type, $cell))
  $cell.addClass(leaveType)
  updateWeeksTotals()
}

function updateWeeksTotals() {
  const shared = $('td.shared').length
  const maternity = $('td.mother.not-shared').length + $('td.mother.compulsory-maternity').length
  const paternity = $('td.partner.not-shared').length
  const remaining = TOTAL_WEEKS_LEAVE - shared - maternity
  $('#shared-weeks').text(shared)
  $('#maternity-weeks').text(maternity)
  $('#paternity-weeks').text(paternity)
  $('#remaining-weeks').text(remaining)
  if (remaining >= 0) {
    $('.remaining-total').removeClass('negative')
  } else {
    $('.remaining-total').addClass('negative')
  }
}
