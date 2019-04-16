const express = require('express')
const router = express.Router()

const moment = require('moment')

const utils = require('./assets/javascripts/utils')
const dataUtils = require('./assets/javascripts/dataUtils')

const { validateDueDate } = require('./validators')

// Add your routes here - above the module.exports line

router.use('/eligibility-tool', require("./routes/eligibilityToolRoutes"))

router.get('/shared-parental-leave-and-pay/eligibility', function (req, res) {
  res.redirect('/shared-parental-leave-and-pay')
})

router.get('/shared-parental-leave-and-pay/apply-for-shared-parental-leave', function (req, res) {
  res.redirect('/shared-parental-leave-and-pay')
})

router.post("/shared-parental-leave-planner/index", function (req, res) {
  const { data } = req.session
  if (data['birth-or-adoption'] === 'birth' && data['provided-date']) {
    res.redirect("/shared-parental-leave-planner/parent-salaries")
  } else if (data['birth-or-adoption']) {
    res.redirect('/shared-parental-leave-planner/due-date')
  } else {
    res.redirect("/shared-parental-leave-planner/birth-or-adoption")
  }
})

router.post("/shared-parental-leave-planner/birth-or-adoption", function (req, res) {
  dataUtils.setParentNames(req.session.data)

  res.redirect('/shared-parental-leave-planner/due-date')
})

router.post("/shared-parental-leave-planner/due-date", function (req, res) {
  const { data } = req.session
  delete data['due-date-errors']
  const {
    'due-date-day': day,
    'due-date-month': month,
    'due-date-year': year
  } = data
  const dueDateErrors = validateDueDate(year, month, day)
  if (dueDateErrors.length > 0) {
    data['due-date-errors'] = dueDateErrors
    res.redirect('/shared-parental-leave-planner/due-date')
  } else {
    res.redirect('/shared-parental-leave-planner/parent-salaries')
  }
})

router.get('/shared-parental-leave-planner', function (req, res) {
  const dueDate = req.query['due']
  const dateParts = dueDate ? dueDate.match(/^(\d\d\d\d)-(\d\d)-(\d\d)$/) : null
  const [_, dueDateYear, dueDateMonth, dueDateDay] = (dateParts || []);
  res.render('shared-parental-leave-planner/index', { dueDateDay, dueDateMonth, dueDateYear })
})

router.route('/shared-parental-leave-planner/planner').get(function (req, res) {
  const { query, session } = req
  const savedData = parseSavedDataFromQuery(query)
  if (!savedData) {
    res.render('shared-parental-leave-planner/planner')
    return
  }
  addSavedDataToSession(session, savedData)
  res.redirect('/shared-parental-leave-planner/planner')
})

router.route('/shared-parental-leave-planner/parent-salaries').post(function (req, res) {
  const { data } = req.session
  const {
    'primary-salary-amount': primarySalaryAmount,
    'primary-salary-period': primarySalaryPeriod,
    'secondary-salary-amount': secondarySalaryAmount,
    'secondary-salary-period': secondarySalaryPeriod
  } = data

  const primaryWeeklyEarnings = getWeeklyEarnings(primarySalaryAmount, primarySalaryPeriod)
  const secondaryWeeklyEarnings = getWeeklyEarnings(secondarySalaryAmount, secondarySalaryPeriod)

  if (data['birth-or-adoption'] === 'birth') {
    data['mother-weekly-pay'] = primaryWeeklyEarnings
    data['partner-weekly-pay'] = secondaryWeeklyEarnings

    res.redirect('/shared-parental-leave-planner/planner-birth')
  } else if (data['birth-or-adoption'] === 'adoption') {
    data['primary-weekly-pay'] = primaryWeeklyEarnings
    data['secondary-weekly-pay'] = secondaryWeeklyEarnings

    res.redirect('/shared-parental-leave-planner/planner-adoption')
  }
})

router.get('/shared-parental-leave-planner/key-dates', function (req, res) {
  const { query, session } = req
  const savedData = parseSavedDataFromQuery(query)
  if (!savedData) {
    res.render('shared-parental-leave-planner/key-dates')
    return
  }
  addSavedDataToSession(session, savedData)
  addLeaveWeeksToSession(session)
  res.redirect('/shared-parental-leave-planner/key-dates')
})

router.post('/shared-parental-leave-planner/summary', function (req, res) {
  addLeaveWeeksToSession(req.session)
  addLeaveBookendsToSession(req.session)
  addPayBlocksToSession(req.session.data)

  res.redirect('/shared-parental-leave-planner/summary')
})

function addPayBlocksToSession(data) {
  const payData = data.pay
  const weeklyPay = getWeeklyPayData(payData)
  data.payBlocks = getPayBlocks(weeklyPay, data['first-leave-start-date'], data['last-leave-start-date'])
}

function getWeeklyPayData (payData) {
  const weeks = Object.keys(payData.mother).reduce((weeksAccumulator, dateKey) => {
    // handle disabled partner weeks at start of planner
    const partnerPay = payData.partner[dateKey] || "£0"
    const currentWeek = {
      date: dateKey,
      mother: payData.mother[dateKey].trim(),
      partner: partnerPay.trim()
    }
    weeksAccumulator.push(currentWeek)
    return weeksAccumulator
  }, [])
  return weeks
}

function addLeaveBookendsToSession (session) {
  const { data } = session
  const allLeaveBlocks = [
    data['maternity-leave'],
    ...data['mothers-spl-blocks'],
    ...data['partners-spl-blocks'],
  ]
  if (data['paternity-leave']) { allLeaveBlocks.push(data['paternity-leave']) }

  const firstLeaveWeekMoment = moment.min(allLeaveBlocks.map(block => moment(block['start'])))
  const lastLeaveWeekMoment = moment.max(allLeaveBlocks.map(block => moment(block['end'])))
  data['first-leave-start-date'] = firstLeaveWeekMoment.format('YYYY-MM-DD')
  data['last-leave-start-date'] = lastLeaveWeekMoment.format('YYYY-MM-DD')
}

function getPayBlocks(weeklyPay, earliestDate, latestDate) {
  const lastElement = array => array[array.length - 1]
  const weekBelongsToBlock = (week, block) => {
    return block && week.mother == block.mother && week.partner === block.partner
  }

  weeklyPay.sort((week1, week2) => { return week1.date < week2.date ? -1 : 1 })
  const payBlocks = []
  weeklyPay.forEach(week => {
    const lastBlock = lastElement(payBlocks)
    if (moment(week.date).isBefore(moment(earliestDate)) || moment(week.date).isAfter(moment(latestDate))) {
      // payblocks should start at first week with leave recorded and end at last week with leave recorded.
      return
    } else if(weekBelongsToBlock(week, lastBlock)) {
      lastBlock.end = week.date
    } else {
      payBlocks.push({
        start: week.date,
        end: week.date,
        mother: week.mother,
        partner: week.partner
      })
    }
  })

  return payBlocks
}

function parseSavedDataFromQuery(query) {
  const savedData = query['s']
  if (!savedData) {
    return null
  }
  const [_, dueDate, encodedWeeks] = savedData.match(/^(\d\d\d\d-\d\d-\d\d)-(.+)$/)
  return { dueDate, encodedWeeks }
}

function addSavedDataToSession(session, savedData) {
  const { dueDate, encodedWeeks } = savedData
  const firstWeek = moment(dueDate).startOf('week').subtract(11, 'weeks')
  const weeks = utils.decodeWeeks(encodedWeeks, firstWeek, moment)
  Object.assign(session.data, { 'due-date': dueDate, ...weeks })
}

function addLeaveWeeksToSession(session) {
  const dueDate = session.data['due-date']
  const leaveWeeks = parseLeaveWeeks(session.data)
  const mothersLeaveBlocks = Array.from(getLeaveBlocks(leaveWeeks.mother))
  const partnersLeaveBlocks = Array.from(getLeaveBlocks(leaveWeeks.partner))

  const maternityLeave = mothersLeaveBlocks.shift()
  session.data['maternity-leave'] = maternityLeave
  session.data['mothers-spl-blocks'] = mothersLeaveBlocks

  const firstPartnerBlock = partnersLeaveBlocks[0]
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
      partnersLeaveBlocks.shift()
    }
  }
  session.data['paternity-leave'] = paternityLeave
  session.data['partners-spl-blocks'] = partnersLeaveBlocks
}

function parseLeaveWeeks(data) {
  const leaveWeeks = { mother: [], partner: [] }
  for (const [key, value] of Object.entries(data)) {
    const keyMatch = key.match(/^(mother|partner)-(\d\d\d\d-\d\d-\d\d)$/)
    if (!keyMatch) {
      continue
    }
    if (value === true || value == 'on') {
      const [_, parent, date] = keyMatch
      leaveWeeks[parent].push(date)
    }
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

function getWeeklyEarnings(amount, period) {
  amount = parseFloat(amount)
  switch (period) {
    case 'week':
      return amount
    case 'month':
      return (amount * 12) / 52
    case 'year':
      return amount / 52
    default:
      return null
  }
}

module.exports = router