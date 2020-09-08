const router = require('express').Router()
const url = require('url')
const fs = require('fs')
const jwt = require('../src/Crypto/jwt')
const db = new (require('./Database/resource'))('localhost', 2424, 'Music Resource')
const __Resource = __dirname+'/../resource'

const getMusicByID = async (req, res)=>{
    const {id} = req.query
    const resource = await db.getMusicByID(id)
    if(!resource.success || !resource.data)
        return res.status(404).send('Not found')
    
    return res.send(resource.data.uri)
}

const getMusicByURI = async (req, res)=>{
    const uri = url.parse(req.url).pathname
    try{
        let path = req.decoded && req.stateID === 2 ? await checkFileAsync(uri) : await checkSampleAsync(uri)
        streamFile(res, path)
    }catch(e){
        console.log(e)
        return res.status(404).send('not found')
    }
}

const streamFile = (res, path) =>{
    const stream = fs.createReadStream(path)
        .on('open', ()=>{
            res.writeHead(200, {"Content-Type": "audio/mp3"})
            stream.pipe(res)
        })
        .on('error',(err)=> res.end(err))
    return stream
}
const checkSampleAsync = (uri) => new Promise((resolve, reject) =>{
    const dir = __Resource+'/sample'+uri+'.mp3'
    fs.stat(dir, (err,stats) => err ? reject(err) : resolve(dir) )
})
const checkFileAsync = (uri) => new Promise((resolve, reject) =>{
    const dir = __Resource+'/music'+uri+'.mp3'
    fs.stat(dir, (err,stats) => err ? reject(err) : resolve(dir) )
})
router.use('/*',jwt.middleware)
router.get('/', getMusicByID)
router.get('/*', getMusicByURI)
module.exports = router