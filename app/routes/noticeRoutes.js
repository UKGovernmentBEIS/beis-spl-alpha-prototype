const express = require('express')
const router = express.Router()
const dataUtils = require('../assets/javascripts/dataUtils')
const dates = require('../assets/javascripts/dates')

router.post('/index', function (req, res) {
  res.redirect('/notice/birth-or-adoption')
})

router.post('/birth-or-adoption', function(req, res) {
  dataUtils.setBirthOrAdoptionInformation(req.session.data)
  res.redirect('/notice/relation-to-child')
})

router.post('/relation-to-child', function(req, res) {
  res.redirect('/notice/which-entitlement')
})

router.post('/which-entitlement', function (req, res) {
  res.redirect('/notice/parent-information')
})

router.get("/parent-information/skip-parent", function (req, res) {
  const { data } = req.session
  if (data['primary-parent-information-complete']) {
    res.redirect('/notice/due-date')
  } else {
    data['primary-parent-information-complete'] = true
    res.redirect('/notice/parent-information')
  }
})

router.post('/parent-information', function (req, res) {
  const { data } = req.session
  if (data['primary-parent-information-complete']) {
    res.redirect('/notice/due-date')
  } else {
    data['primary-parent-information-complete'] = true
    res.redirect('/notice/parent-information')
  }
})

router.post('/due-date', function (req, res) {
  res.redirect('/notice/entitlement-and-intention')
})

router.post('/entitlement-and-intention', function (req, res) {
  req.session.data['notice-leave-blocks'] = []
  res.redirect('/notice/spl-dates')
})

router.post('/spl-dates/add-another', function (req, res) {
  const newBlockData = req.session.data['notice-leave-blocks'].new
  const newBlockStart = dates.providedDate(newBlockData.start.year, newBlockData.start.month, newBlockData.start.day)
  const newBlockEnd = dates.providedDate(newBlockData.end.year, newBlockData.end.month, newBlockData.end.day)
  req.session.data['notice-leave-blocks'].push({
    start: newBlockStart,
    end: newBlockEnd,
    binding: newBlockData.binding
  })
  res.redirect('/notice/spl-dates')
})

router.post('/spl-dates', function(req, res) {
  res.redirect('/notice/summary')
})

module.exports = router