const router = require('express').Router()
const Auth = require('./Authentication')
const Account = require('./Account')
const Media = require('./Media')

router.use('/authentication', Auth)
router.use('/account', Account)
router.use('/media', Media)


//router.get('/authentication')
//router.get('/account')


module.exports = router