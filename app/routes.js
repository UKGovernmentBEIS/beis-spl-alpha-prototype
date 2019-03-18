const express = require('express')
const router = express.Router()

const moment = require('moment')
const querystring = require('querystring')

// Add your routes here - above the module.exports line

router.get('/shared-parental-leave-planner', function (req, res) {
  const dueDate = req.query['due']
  const dateParts = dueDate ? dueDate.match(/^(\d\d\d\d)-(\d\d)-(\d\d)$/) : null
  const [_, dueDateYear, dueDateMonth, dueDateDay] = (dateParts || []);
  res.render('shared-parental-leave-planner/index', { dueDateDay, dueDateMonth, dueDateYear })
})

router.get('/shared-parental-leave-planner/planner/key-dates', function (req, res) {
  const {
    'due': dueDate,
    'maternity-start': maternityStart,
    'maternity-end': maternityEnd,
    'paternity-start': paternityStart,
    'paternity-end': paternityEnd
  } = req.query

  const maternityLeave = getLeaveBlock(maternityStart, maternityEnd)
  const mothersSplBlocks = parseSplBlocks(req.query, 'mother')
  const partnersSplBlocks = parseSplBlocks(req.query, 'partner')
  const data = { dueDate, maternityLeave, mothersSplBlocks, partnersSplBlocks }

  if (paternityStart && paternityEnd) {
    data.paternityLeave = getLeaveBlock(paternityStart, paternityEnd)
  }

  res.render('shared-parental-leave-planner/planner/key-dates', data)
})

function parseSplBlocks(query, parent) {
  const blocks = []
  const totalSplBlocks = parseInt(query[`${parent}-spl-blocks`])
  for (let i = 0; i < totalSplBlocks; i++) {
    const blockNumber = i + 1
    const start = query[`${parent}-spl-${blockNumber}-start`]
    const end = query[`${parent}-spl-${blockNumber}-end`]
    const block = getLeaveBlock(start, end)
    block.number = blockNumber
    blocks.push(block)
  }
  return blocks
}

function getLeaveBlock(start, end) {
  const numberOfWeeks = moment(end).diff(start, 'weeks') + 1
  const length = `${numberOfWeeks} week${numberOfWeeks === 1 ? '' : 's'}`
  return { start, end, length }
}

router.post('/shared-parental-leave-planner/planner/key-dates', function (req, res) {
  const leaveWeeks = { mother: [], partner: [] }
  for (const [key, value] of Object.entries(req.body)) {
    const keyMatch = key.match(/^(mother|partner)-(\d\d\d\d-\d\d-\d\d)$/)
    if (!keyMatch || value != 'on') {
      continue
    }
    const parent = keyMatch[1]
    const date = keyMatch[2]
    leaveWeeks[parent].push(date)
  }

  const dueDate = req.body['due-date']
  const { mother: motherLeaveWeeks, partner: partnerLeaveWeeks } = leaveWeeks
  const motherLeaveBlocks = Array.from(getLeaveBlocks(motherLeaveWeeks))
  const partnerLeaveBlocks = Array.from(getLeaveBlocks(partnerLeaveWeeks))

  const query = buildQueryString(dueDate, motherLeaveBlocks, partnerLeaveBlocks)

  res.redirect('/shared-parental-leave-planner/planner/key-dates?' + query)
})

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

function buildQueryString(dueDate, motherLeaveBlocks, partnerLeaveBlocks) {
  const query = { 'due': dueDate }
  const maternityLeave = motherLeaveBlocks.shift()
  query['maternity-start'] = maternityLeave.start
  query['maternity-end'] = maternityLeave.end
  query['mother-spl-blocks'] = motherLeaveBlocks.length
  for (let i = 0; i < motherLeaveBlocks.length; i++) {
    const block = motherLeaveBlocks[i]
    query[`mother-spl-${i + 1}-start`] = block.start
    query[`mother-spl-${i + 1}-end`] = block.end
  }
  const firstPartnerBlock = partnerLeaveBlocks[0]
  const hasPaternityLeave = firstPartnerBlock && isEligiblePaternityWeek(firstPartnerBlock.start, dueDate)
  if (hasPaternityLeave) {
    const paternityLeaveStart = firstPartnerBlock.start
    const secondWeek = moment(paternityLeaveStart).add(1, 'week')
    const secondWeekIsPaternity = isEligiblePaternityWeek(secondWeek, dueDate) && secondWeek.isSameOrBefore(firstPartnerBlock.end)
    const paternityLeaveEnd = secondWeekIsPaternity ? secondWeek.format('YYYY-MM-DD') : paternityLeaveStart
    query['paternity-start'] = paternityLeaveStart
    query['paternity-end'] = paternityLeaveEnd
    const weekAfterPaternity = moment(paternityLeaveEnd).add(1, 'week')
    if (weekAfterPaternity.isSameOrBefore(firstPartnerBlock.end)) {
      // Shift first block date to repurpose as first SPL block.
      firstPartnerBlock.start = weekAfterPaternity.format('YYYY-MM-DD')
    } else {
      // First block was only paternity leave, so remove it.
      partnerLeaveBlocks.shift()
    }
  }
  query['partner-spl-blocks'] = partnerLeaveBlocks.length
  for (let i = 0; i < partnerLeaveBlocks.length; i++) {
    const block = partnerLeaveBlocks[i]
    query[`partner-spl-${i + 1}-start`] = block.start
    query[`partner-spl-${i + 1}-end`] = block.end
  }
  return querystring.stringify(query)
}

function isEligiblePaternityWeek(week, dueDate) {
  const birthWeek = moment(dueDate).startOf('week')
  return moment(week).diff(birthWeek, 'weeks') < 8
}

module.exports = router
