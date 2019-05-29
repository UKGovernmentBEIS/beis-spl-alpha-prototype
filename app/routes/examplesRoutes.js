const express = require('express')
const router = express.Router()

router.get('/managing-parenting-and-your-career', function (req, res) {
  res.render('shared-parental-leave-planner/examples/managing-parenting-and-your-career')
})

module.exports = router