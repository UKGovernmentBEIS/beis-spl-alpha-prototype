const express = require('express')
const router = express.Router()

const { validateDueDate } = require('../validators')

router.post('/eligibility-tool/questions-about-your-partner', function (req, res) {
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