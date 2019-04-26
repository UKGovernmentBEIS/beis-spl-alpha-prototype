/* global $, utils */

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
  }).on('mousedown', function (mouseDownEvent) {
    if (mouseDownEvent.which !== 1) {
      // Only respond to primary mouse button.
      return
    }

    const $originalCell = $(this).closest('td')
    if ($originalCell.hasClass(DISABLED)) {
      return
    }

    mouseDownEvent.preventDefault()

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


    // Scrollling
    const scrolling = { up: null, down: null }

    function scroll(direction) {
      const scrollPx = 15
      if (direction === 'up') {
        $(window).scrollTop($(window).scrollTop() - scrollPx)
      } else if (direction === 'down') {
        $(window).scrollTop($(window).scrollTop() + scrollPx)
      }
    }

    function startScrolling(direction) {
      const scrollTime = 15
      scrolling[direction] = setInterval(() => scroll(direction), scrollTime)
    }

    function stopScrolling(direction) {
      clearInterval(scrolling[direction])
      scrolling[direction] = null
    }

    $(document).mouseup(function() {
      stopScrolling('up')
      stopScrolling('down')
      $calendar.off('mousemove')
    })

    let prevYCoord = mouseDownEvent.pageY
    $calendar.bind('mousemove', function(mouseMoveEvent) {
      const currentYCoord = mouseMoveEvent.pageY
      if (!scrolling['down'] && prevYCoord < currentYCoord) {
        if (mouseMoveEvent.clientY > 0.8 * $(window).height()) {
          stopScrolling('up')
          startScrolling('down')
        }
      } else if (!scrolling['up'] && prevYCoord > currentYCoord) {
        if (mouseMoveEvent.clientY < 0.2 * $(window).height()) {
          stopScrolling('down')
          startScrolling('up')
        }
      }
      prevYCoord = currentYCoord
    })
  })

  $('.pay-indicator').on('click', function() {
    const $cell = $(this).prev()
    if (!hasLeave($cell)) {
      addLeave($cell)
    } else if ($cell.hasClass('with-pay')) {
      $cell.removeClass('with-pay')
    } else {
      $cell.addClass('with-pay')
    }
    updatePay()
  })

  $('input#show-statutory-pay').on('change', function () {
    const checked = $(this).prop('checked')
    $calendar.toggleClass('show-pay', checked)
    $('.pay-only').toggle(checked)
    $('.not-pay').toggle(!checked)
  }).change()

  $('.leave-example').on('click', function () {
    const $this = $(this)
    const motherLeave = $this.data('mother-leave').split(',').map(function (n) { return parseInt(n) })
    const partnerLeave = $this.data('partner-leave').split(',').map(function (n) { return parseInt(n) })
    const warning = 'This will overwrite any leave that you have already entered on the calendar.'
    if ($('.mother-leave').length + $('.partner-leave').length > 2 && !confirm(warning)) {
      return
    }
    $('.mother, .partner').each(function () {
      const $cell = $(this)
      removeLeave($cell)
    })
    $('.mother').each(function () {
      const $cell = $(this)
      const weekNumber = getWeekNumber($cell)
      if (motherLeave.indexOf(weekNumber) !== -1) {
        addLeave($cell)
      }
    })
    $('.partner').each(function () {
      const $cell = $(this)
      const weekNumber = getWeekNumber($cell)
      if (partnerLeave.indexOf(weekNumber) !== -1) {
        addLeave($cell)
      }
    })
    onLeaveUpdated()
    $('.birth-week').prev().prev()[0].scrollIntoView(true)
    $('button#clear-example').removeAttr('disabled')
  })

  $("#planner-form").on('submit', function () {
    // store mother pay amount in hidden text field
    $('.pay-amount-input').each(function(_, payInput) {
      let amount
      $payInput = $(payInput)
      const $cell = $payInput.closest('td')
      if($cell.hasClass("with-initial-maternity-pay")) {
        amount = $cell.find(".initial-maternity-pay").text()
      } else if ($cell.hasClass("with-statutory-pay")) {
        amount = $cell.find(".statutory-pay").text()
      } else {
        amount = '£0'
      }
      $payInput.val(amount)
    })
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
    // Add leave to this week and all weeks up to birth week.
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
  if (isLeave) {
    $cell.toggleClass('with-pay', hasRemainingSharedPayWeeks())
  } else {
    $cell.removeClass('with-pay')
  }
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
  $('.maternity-spl-remaining.total').toggleClass(NEGATIVE, maternitySplRemainingWeeks < 0)

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

function hasRemainingSharedPayWeeks() {
  return $('.with-pay .maternity-leave:visible, .with-pay .shared-parental-leave:visible').length < MATERNITY_PAY_WEEKS
}

function updatePay() {
  $('.with-initial-maternity-pay').removeClass('with-initial-maternity-pay')
  $('.with-statutory-pay').removeClass('with-statutory-pay')
  $('.with-unpaid').removeClass('with-unpaid')

  const $maternityWeeks = $('.with-pay .maternity-leave:visible')
  $maternityWeeks.slice(0, INITIAL_MATERNITY_PAY_WEEKS).parent().parent().addClass('with-initial-maternity-pay')
  $maternityWeeks.slice(INITIAL_MATERNITY_PAY_WEEKS).parent().parent().addClass('with-statutory-pay')
  $('td:not(.with-pay) .maternity-leave:visible').parent().parent().addClass('with-unpaid')

  const $splWeeks = $('.with-pay .shared-parental-leave:visible')
  $splWeeks.parent().parent().addClass('with-statutory-pay')
  $('td:not(.with-pay) .shared-parental-leave:visible').parent().parent().addClass('with-unpaid')

  const $paternityWeeks = $('.paternity-leave:visible')
  $paternityWeeks.slice(0, PATERNITY_PAY_WEEKS).parent().parent().addClass('with-pay').addClass('with-statutory-pay')
  $paternityWeeks.slice(PATERNITY_PAY_WEEKS).parent().parent().addClass('with-unpaid')

  const maternityOrSharedPaidWeeks = $('.with-pay .maternity-leave:visible, .with-pay .shared-parental-leave:visible').length
  const maternityOrSharedRemainingPaidWeeks = MATERNITY_PAY_WEEKS - maternityOrSharedPaidWeeks
  const hasUnpaidWeeks = $('.is-unpaid:visible').length > 0

  // Remaining pay.
  $('#mother-shared-paid-weeks').text(toWeeksString(maternityOrSharedPaidWeeks))
  $('#mother-shared-remaining-paid-weeks').text(toWeeksString(maternityOrSharedRemainingPaidWeeks))
  $('.paid-weeks-remaining.total').toggleClass(NEGATIVE, maternityOrSharedRemainingPaidWeeks < 0)

  // Warnings
  $('#maternity-or-shared-pay-maximum').toggle(maternityOrSharedRemainingPaidWeeks < 0)
  $('#paid-leave-remaining').toggle(hasUnpaidWeeks && maternityOrSharedRemainingPaidWeeks > 0)
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