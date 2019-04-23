const express = require('express')
const router = express.Router()

module.exports = router

const dataUtils = require('../assets/javascripts/dataUtils')

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