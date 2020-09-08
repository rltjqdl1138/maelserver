const router = require('express').Router()
const Auth = require('./Authentication')
const Account = require('./Account')
const Media = require('./Media')
const Notice = require('./Notice')
const Analytics = require('./Analytics')

router.use('/authentication', Auth)
router.use('/account', Account)
router.use('/media', Media)
router.use('/notice', Notice)
router.use('/analytics', Analytics)

//router.get('/authentication')
//router.get('/account')


module.exports = router