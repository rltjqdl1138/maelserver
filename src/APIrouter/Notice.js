const fs = require('fs')
const url = require('url')
const router = require('express').Router()
const BasicNotice = require('./BasicNotice.json')
const db = new (require('../Database/notice'))('localhost', 2424, 'Notice')

const __Resource = __dirname+'/../../resource'

const basic = (req,res)=>{
    const {page} = req.query
    page === undefined ? 
        fs.readdir(`${__Resource}/notice/`,(err, files)=>{
            if(err) return res.json({success:false})
            const result = files.map(item=>{
                return item
            })
            return res.json({success:true, data:result})
        }):
        getPlanNoticeList(req, res)
}

const getPlanNoticeList = async(req, res)=>{
    const {page} = req.query
    const limit = req.query.limit ? req.query.limit : 10
    const result = await db.getNotice()
    if(!result.success)
        return res.json({success:false})
    else if(limit * page > result.data.length)
        return res.json({success:true, data:[]})
    const list = result.data.slice(page*limit, Math.min((page+1)*limit), result.data.length)
    return res.json({success:true, data:list})
}

const registerPlanNotice = async(req, res)=>{
    const {title, main} = req.body
    if(!title || !main || typeof title !== 'string' || typeof main !== 'string')
        return res.json({success:false})
    const result = await db.registerNotice(title, main)
    return res.json(result)
}

const getNotice = (req, res)=>{
    const uri = url.parse(req.url).pathname
    console.log('get notice', url)
    fs.readFile(`${__Resource}/notice/${uri}`,(err, data)=>{
        if(err) return res.json({success:false, title:'Notice', data:BasicNotice.list})
        const result = JSON.parse(data)
        return res.json({
            success:true,
            title: result.title,
            data: result.list
        })
    })
}
const makeNotice = (req, res)=>{
    console.log('Make notice')
    const uri = url.parse(req.url).pathname
    const fileurl = `${__Resource}/notice/${uri}`
    if(fs.existsSync(fileurl))
        return res.json({success:false, msg:'already exist'})
    else{
        const dat = {title:'new Notice', list:[]}
        fs.writeFile(fileurl,  JSON.stringify(dat), 
            err => res.json(err ? {success:false} : {success:true}))
    }
}
const updateNotice = (req, res)=>{
    const uri = url.parse(req.url).pathname
    const fileurl = `${__Resource}/notice${uri}`
    console.log(uri, fileurl)
    const {title, main} = req.body
    if(!title || !main)
        return {success:false}

    const dat = {title, list:main}
    fs.writeFile(fileurl,  JSON.stringify(dat), 
        err => res.json(err ? {success:false} : {success:true}))
}

const deleteNotice = (req, res)=>{
    const uri = url.parse(req.url).pathname
    const fileurl = `${__Resource}/notice/${uri}`
    fs.unlink(fileurl, err => res.json({success: !err ? true:false}))
}
router.get('/',basic)
router.post('/',registerPlanNotice)


router.get('/*', getNotice)
router.post('/*', makeNotice)
router.put('/*', updateNotice)
router.delete('/*', deleteNotice)
module.exports = router