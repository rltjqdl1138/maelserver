const router = require('express').Router()
const Auth = require('./Authentication')
const Account = require('./Account')
const Media = require('./Media')
const Notice = require('./Notice')

router.use('/authentication', Auth)
router.use('/account', Account)
router.use('/media', Media)
router.use('/notice', Notice)

//router.get('/authentication')
//router.get('/account')


module.exports = router