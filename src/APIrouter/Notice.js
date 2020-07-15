const fs = require('fs')
const url = require('url')
const router = require('express').Router()
const BasicNotice = require('./BasicNotice.json')

const __Resource = __dirname+'/../../resource'

const basic = (req,res)=>{
    fs.readdir(`${__Resource}/notice/`,(err, files)=>{
        if(err) return res.json({success:false})
        const result = files.map(item=>{
            console.log(item)
            return item
        })
        return res.json({success:true, data:result})
    })
}
const getNotice = (req, res)=>{
    const uri = url.parse(req.url).pathname
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
    const fileurl = `${__Resource}/notice/${uri}`
    const {title, data} = req.body
    if(!title || !data)
        return {success:false}

    const dat = {title, list:data}
    fs.writeFile(fileurl,  JSON.stringify(dat), 
        err => res.json(err ? {success:false} : {success:true}))
}

const deleteNotice = (req, res)=>{
    const uri = url.parse(req.url).pathname
    const fileurl = `${__Resource}/notice/${uri}`
    fs.unlink(fileurl, err => res.json({success: !err ? true:false}))
}
router.get('/',basic)
router.get('/*', getNotice)
router.post('/*', makeNotice)
router.put('/*', updateNotice)
router.delete('/*', deleteNotice)
module.exports = router