const router = require('express').Router()
const axios = require('axios')
const jwt = require('../Crypto/jwt')
const db = new (require('../Database/Analytics'))('localhost', 2424, 'Analytics')


const getUserLog = async (req, res)=>{
    const {begin, end, uid} = req.query
    const data = await db.getUserLog({uid, beginTime:begin, endTime:end})
    res.json(data)
}


//Sign Authentication
router.get('/', getUserLog)


module.exports = router