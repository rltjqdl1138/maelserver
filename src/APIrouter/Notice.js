const router = require('express').Router()
const UsageNotice = require('./UsageNotice.json')

const basic = (req,res)=>{
    res.json({text:'welcome'})
}
const getUsageNotice = (req, res)=>{
    res.json({success:true, title:'이용안내 및 약관',
        data:UsageNotice.list})
}
const getPlanNotice = (req, res)=>{
    res.json({success:true, title:'플랜 안내',
        data:UsageNotice.list})
}
router.get('/',basic)
router.get('/usage', getUsageNotice)
router.get('/plan', getPlanNotice)
module.exports = router