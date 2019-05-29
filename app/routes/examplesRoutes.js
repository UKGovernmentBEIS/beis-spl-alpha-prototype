const express = require('express')
const router = express.Router()

router.get('/managing-parenting-and-your-career', function (req, res) {
  res.render('shared-parental-leave-planner/examples/managing-parenting-and-your-career')
})

router.get('/supporting-the-mother-after-birth', function (req, res) {
  res.render('shared-parental-leave-planner/examples/supporting-the-mother-after-birth')
})

module.exports = router