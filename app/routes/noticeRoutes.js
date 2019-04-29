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
  if (data['current-parent-information-complete']) {
    res.redirect('/notice/due-date')
  } else {
    data['current-parent-information-complete'] = true
    res.redirect('/notice/parent-information')
  }
})

router.get("/parent-information/back", function (req, res) {
  const { data } = req.session
  if (data['current-parent-information-complete']) {
    data['current-parent-information-complete'] = false
    res.redirect('/notice/parent-information')
  } else {
    res.redirect('/notice/which-entitlement')
  }
})

router.post('/parent-information', function (req, res) {
  const { data } = req.session
  if (data['current-parent-information-complete']) {
    res.redirect('/notice/due-date')
  } else {
    data['current-parent-information-complete'] = true
    res.redirect('/notice/parent-information')
  }
})

router.post('/parent-information/use-other-parent-address', function(req, res) {
  const addressFields = [ 'address-line-1', 'address-line-2', 'address-town', 'address-county', 'address-postcode' ]
  const { data } = req.session
  const currentParent = data['current-parent']
  const otherParent = data['current-parent'] === 'primary' ? 'secondary' : 'primary'
  addressFields.forEach(field => data[`${currentParent}-${field}`] = data[`${otherParent}-${field}`])

  res.redirect('/notice/parent-information')
})

router.post('/due-date', function (req, res) {
  res.redirect('/notice/entitlement-and-intention')
})

router.post('/entitlement-and-intention', function (req, res) {
  const { data } = req.session
  data['maternity-leave-start'] = dates.providedDate(data['maternity-leave-start-year'], data['maternity-leave-start-month'], data['maternity-leave-start-day'])
  data['maternity-leave-end'] = dates.providedDate(data['maternity-leave-end-year'], data['maternity-leave-end-month'], data['maternity-leave-end-day'])
  data['maternity-pay-start'] = dates.providedDate(data['maternity-pay-start-year'], data['maternity-pay-start-month'], data['maternity-pay-start-day'])
  data['maternity-pay-end'] = dates.providedDate(data['maternity-pay-end-year'], data['maternity-pay-end-month'], data['maternity-pay-end-day'])
  res.redirect('/notice/shared-entitlement-and-intention')
})

router.post('/shared-entitlement-and-intention', function (req, res) {
  const { data } = req.session
  data['notice-leave-blocks'] = []
  const parent = data[`${data['current-parent']}-name`]
  if (data[`${parent}s-spl-blocks`]) {
    data[`${parent}s-spl-blocks`].forEach(block => data['notice-leave-blocks'].push(block))
  }
  res.redirect('/notice/spl-dates')
})

router.post('/spl-dates/add-another', function (req, res) {
  if (!req.session.data['notice-leave-blocks']) { req.session.data['notice-leave-blocks'] = [] }
  saveNewNoticeLeaveBlock(req.session.data)
  res.redirect('/notice/spl-dates')
})

router.post('/spl-dates', function(req, res) {
  saveNewNoticeLeaveBlock(req.session.data)
  res.redirect('/notice/summary')
})

router.get('/spl-dates/delete/:id', function (req, res) {
  const { data } = req.session
  data['notice-leave-blocks'].splice(req.params.id, 1)
  res.redirect('/notice/spl-dates')
})

router.get('/reset', function(req, res) {
  const { data } = req.session
  data['current-parent-information-complete'] = false
  data['current-parent'] = data['current-parent'] === 'primary' ? 'secondary' : 'primary'
  res.redirect('/notice')
})

module.exports = router

const saveNewNoticeLeaveBlock = function (data) {
  const newBlockData = data['new-notice-leave-blocks']
  const newBlockStart = dates.providedDate(newBlockData.start.year, newBlockData.start.month, newBlockData.start.day)
  const newBlockEnd = dates.providedDate(newBlockData.end.year, newBlockData.end.month, newBlockData.end.day)
  data['notice-leave-blocks'].push({
    start: newBlockStart,
    end: newBlockEnd
  })
}