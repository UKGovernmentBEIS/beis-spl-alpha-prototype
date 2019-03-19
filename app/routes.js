const express = require('express')
const router = express.Router()

const moment = require('moment')

// Add your routes here - above the module.exports line

router.get('/shared-parental-leave-planner', function (req, res) {
  const dueDate = req.query['due']
  const dateParts = dueDate ? dueDate.match(/^(\d\d\d\d)-(\d\d)-(\d\d)$/) : null
  const [_, dueDateYear, dueDateMonth, dueDateDay] = (dateParts || []);
  res.render('shared-parental-leave-planner/index', { dueDateDay, dueDateMonth, dueDateYear })
})

router.post('/shared-parental-leave-planner/planner/key-dates', function (req, res) {
  const dueDate = req.session.data['due-date']

  const leaveWeeks = parseLeaveWeeks(req.session.data)
  const motherLeaveBlocks = Array.from(getLeaveBlocks(leaveWeeks.mother))
  const partnerLeaveBlocks = Array.from(getLeaveBlocks(leaveWeeks.partner))

  const maternityLeave = motherLeaveBlocks.shift()
  req.session.data['maternity-leave'] = maternityLeave
  req.session.data['mothers-spl-blocks'] = motherLeaveBlocks

  const firstPartnerBlock = partnerLeaveBlocks[0]
  const hasPaternityLeave = firstPartnerBlock && isEligiblePaternityWeek(firstPartnerBlock.start, dueDate)
  let paternityLeave = null
  if (hasPaternityLeave) {
    const paternityLeaveStart = firstPartnerBlock.start
    const secondWeek = moment(paternityLeaveStart).add(1, 'week')
    const secondWeekIsPaternity = isEligiblePaternityWeek(secondWeek, dueDate) && secondWeek.isSameOrBefore(firstPartnerBlock.end)
    const paternityLeaveEnd = secondWeekIsPaternity ? secondWeek.format('YYYY-MM-DD') : paternityLeaveStart
    paternityLeave = { start: paternityLeaveStart, end: paternityLeaveEnd}
    const weekAfterPaternity = moment(paternityLeaveEnd).add(1, 'week')
    if (weekAfterPaternity.isSameOrBefore(firstPartnerBlock.end)) {
      // Shift first block date to repurpose as first SPL block.
      firstPartnerBlock.start = weekAfterPaternity.format('YYYY-MM-DD')
    } else {
      // First block was only paternity leave, so remove it.
      partnerLeaveBlocks.shift()
    }
  }

  req.session.data['paternity-leave'] = paternityLeave
  req.session.data['partners-spl-blocks'] = partnerLeaveBlocks

  res.redirect('/shared-parental-leave-planner/planner/key-dates')
})

function parseLeaveWeeks(data) {
  const leaveWeeks = { mother: [], partner: [] }
  for (const [key, value] of Object.entries(data)) {
    const keyMatch = key.match(/^(mother|partner)-(\d\d\d\d-\d\d-\d\d)$/)
    if (!keyMatch || value != 'on') {
      continue
    }
    const parent = keyMatch[1]
    const date = keyMatch[2]
    leaveWeeks[parent].push(date)
  }
  return leaveWeeks
}

function* getLeaveBlocks(leaveWeeks) {
  leaveWeeks.sort()
  let currentBlock = null
  for (const date of leaveWeeks) {
    if (currentBlock === null) {
      currentBlock = { start: date, end: date }
    } else if (moment(date).diff(currentBlock.end, 'weeks') === 1) {
      currentBlock.end = date
    } else {
      yield currentBlock
      currentBlock = { start: date, end: date }
    }
  }
  if (currentBlock !== null) {
    yield currentBlock
  }
}

function isEligiblePaternityWeek(week, dueDate) {
  const birthWeek = moment(dueDate).startOf('week')
  return moment(week).diff(birthWeek, 'weeks') < 8
}

module.exports = router
