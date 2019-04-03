const express = require('express')
const router = express.Router()

const { validateDueDate } = require('../validators')

router.post('/birth-or-adoption', function(req, res) {
  res.redirect('start-date')
})
  const data = req.session.data
  const eligibilityData = {
    employmentStatus: data['employment-status'],
    continuousWork: data['continuous-work'],
    payThreshold: data['pay-threshold'],
    partnerWork: data['partner-work'],
    partnerPay: data['partner-pay']
  }

  data.eligibility = getEligibility(eligibilityData)
  res.redirect('results')
})

router.post('/start-date', function (req, res) {
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
    res.redirect('/eligibility-tool/start-date')
  } else {
    res.redirect('/eligibility-tool/results')
  }
})

function getEligibility(eligibilityData) {
  const isYes = field => field === "yes"
  const isNo = field => field === "no"

  const {
    employmentStatus,
    continuousWork,
    payThreshold,
    partnerWork,
    partnerPay
  } = eligibilityData

  const eligibility = { spl: false, shpp: false}

  if (isNo(partnerWork) || isNo(partnerPay)) { return eligibility }

  if (employmentStatus === "worker") {
    eligibility.shpp = isYes(continuousWork) && isYes(payThreshold)
  }

  if (employmentStatus === "employee") {
    eligibility.shpp = isYes(continuousWork) && isYes(payThreshold)
    eligibility.spl = isYes(continuousWork)
  }

  return eligibility
}

module.exports = router