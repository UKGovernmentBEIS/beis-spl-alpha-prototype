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

module.exports = router