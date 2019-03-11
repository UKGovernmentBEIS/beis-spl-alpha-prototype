/* global $ */

// Warn about using the kit in production
if (window.console && window.console.info) {
  window.console.info('GOV.UK Prototype Kit - do not use for production')
}

const SHARED = 'shared'
const NOT_SHARED = 'not-shared'

const TOTAL_WEEKS_LEAVE = 52

$(document).ready(function () {
  window.GOVUKFrontend.initAll()

  updateWeeksTotals()

  $('td.mother:not(.compulsory-maternity), td.partner').click(function () {
    $this = $(this)
    const selectedLeaveType = $('input[name=leave-type]:checked').val()
    const leaveClassesToRemove = [SHARED, NOT_SHARED].filter(className => className != selectedLeaveType)
    leaveClassesToRemove.forEach(leaveClass => $this.removeClass(leaveClass))
    $this.toggleClass(selectedLeaveType)
    updateWeeksTotals()
  })
})

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
