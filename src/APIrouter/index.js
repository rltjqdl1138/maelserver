const router = require('express').Router()
const Auth = require('./Authentication')
router.use('/authentication', Auth)


//router.get('/authentication')
//router.get('/account')


module.exports = router