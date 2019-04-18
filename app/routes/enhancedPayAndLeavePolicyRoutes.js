const express = require('express')
const router = express.Router()

router.post('/type-of-leave', function (req, res) {
  if (req.session.data['leave-type'] === 'shared') {
    res.redirect('/enhanced-pay-and-leave-policy/multiple-blocks-of-leave')
  } else {
    res.redirect('/enhanced-pay-and-leave-policy/which-weeks-are-paid')
  }
})

router.post('/multiple-blocks-of-leave', function (req, res) {
  res.redirect('/enhanced-pay-and-leave-policy/which-weeks-are-paid')
})

router.get('/which-weeks-are-paid', function (req, res) {
  const { data } = req.session
  if (!data['leave-blocks']) {
    data['leave-blocks'] = [newLeaveBlock()]
  }
  res.render('enhanced-pay-and-leave-policy/which-weeks-are-paid', { data })
})

router.get('/remove-block/:blockId', function (req, res) {
  const { data } = req.session
  const { blockId } = req.params
  data['leave-blocks'].splice(blockId, 1)
  res.redirect('/enhanced-pay-and-leave-policy/which-weeks-are-paid')
})

router.post('/which-weeks-are-paid/:action', function (req, res) {
  const { data } = req.session
  if (req.params.action === 'add-another') {
    data['leave-blocks'].push(newLeaveBlock())
    res.redirect('/enhanced-pay-and-leave-policy/which-weeks-are-paid')
  } else {
    res.redirect('/enhanced-pay-and-leave-policy/statutory-pay')
  }
})

const newLeaveBlock = () => { return { weeks: "", percentOfSalary: "" }}

module.exports = router