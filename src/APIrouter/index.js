const router = require('express').Router()
const Auth = require('./Authentication')
const Account = require('./Account')

router.use('/authentication', Auth)
router.use('/account', Account)

//router.get('/authentication')
//router.get('/account')


module.exports = router