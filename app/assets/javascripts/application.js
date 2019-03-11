/* global $ */

// Warn about using the kit in production
if (window.console && window.console.info) {
  window.console.info('GOV.UK Prototype Kit - do not use for production')
}

const SHARED = 'shared'
const NOT_SHARED = 'not-shared'

$(document).ready(function () {
  window.GOVUKFrontend.initAll()

  $('td.mother:not(.compulsory-maternity), td.partner').click(function () {
    $this = $(this)
    const selectedLeaveType = $('input[name=leave-type]:checked').val()
    const leaveClassesToRemove = [SHARED, NOT_SHARED].filter(className => className != selectedLeaveType)
    leaveClassesToRemove.forEach(leaveClass => $this.removeClass(leaveClass))
    $this.toggleClass(selectedLeaveType)
  })
})
