const express = require('express')
const router = express.Router()

const dates = require('../assets/javascripts/dates')
const dataUtils = require('../assets/javascripts/dataUtils')
const { validateDueDate } = require('../validators')

router.post('/birth-or-adoption', function(req, res) {
  dataUtils.setBirthOrAdoptionInformation(req.session.data)
  res.redirect('caring-with-partner')
})

router.post('/caring-with-partner', function (req, res) {
  const { data } = req.session
  if (data['caring-with-partner'] === "no") {
    data['primary-eligibility'] = { spl: false, shpp: false }
    data['secondary-eligibility'] = { spl: false, shpp: false }
    res.redirect('/eligibility-tool/results')
  } else {
    data['primary-eligibility'] = { spl: undefined, shpp: undefined }
    data['secondary-eligibility'] = { spl: undefined, shpp: undefined }
    res.redirect('/eligibility-tool/start-date')
  }
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
    const isAdoption = data['birth-or-adoption'] === 'adoption'
    Object.assign(data, {
      'provided-date': dates.providedDate(year, month, day),
      'twenty-six-weeks-before-qualifying': dates.twentySixWeeksBeforeQualifying(year, month, day, isAdoption),
      'eight-weeks-before-qualifying': dates.eightWeeksBeforeQualifying(year, month, day, isAdoption),
      'qualifying-week': dates.qualifyingWeek(year, month, day, isAdoption)
    })
    if (!isAdoption) {
      data['sixty-six-weeks-before-due'] = dates.sixtySixWeeksBeforeDueDate(year, month, day)
    }
    res.redirect('/eligibility-tool/results')
  }
})

router.post('/results', function(req, res) {
  res.redirect('/shared-parental-leave-planner')
})

router.post('/employment', function (req, res) {
  res.redirect('/eligibility-tool/pay-and-leave')
})

router.get('/check-eligibility/:primaryOrSecondary', function (req, res) {
  const { data } = req.session
  data['current-parent'] = req.params.primaryOrSecondary
  res.redirect('/eligibility-tool/employment-status')
})

router.post('/pay-and-leave', function (req, res) {
  res.redirect('/eligibility-tool/partners-pay-and-leave')
})

router.post('/partners-pay-and-leave', function (req, res) {
  const { data } = req.session
  const eligibilityData = {
    employmentStatus: data['employment-status'],
    workStart: data['work-start'],
    continuousWork: data['continuous-work'],
    payThreshold: data['pay-threshold'],
    partnerWork: data['partner-work'],
    partnerPay: data['partner-pay']
  }
  const eligibilityKey = `${data['current-parent']}-eligibility`
  data[eligibilityKey] = getEligibility(eligibilityData)
  res.redirect('results')
})

function getEligibility(eligibilityData) {
  const isYes = field => field === "yes"
  const isNo = field => field === "no"

  const {
    employmentStatus,
    workStart,
    continuousWork,
    payThreshold,
    partnerWork,
    partnerPay
  } = eligibilityData

  const eligibility = { spl: false, shpp: false}

  if (isNo(partnerWork) || isNo(partnerPay)) { return eligibility }

  if (employmentStatus === "worker") {
    eligibility.shpp = isYes(workStart) && isYes(continuousWork) && isYes(payThreshold)
  }

  if (employmentStatus === "employee") {
    eligibility.shpp = isYes(workStart) && isYes(continuousWork) && isYes(payThreshold)
    eligibility.spl = isYes(workStart) && isYes(continuousWork)
  }

  return eligibility
}

module.exports = router