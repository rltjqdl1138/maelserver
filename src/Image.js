const router = require('express').Router()
const url = require('url')
const fs = require('fs')
const db = new (require('./Database/resource'))('localhost', 2424, 'Image Resource')

const base = (req, res) => {
    console.log('base')
    res.json({msg:'Welcome mael'})
}

const getImageByURI = async (req, res)=>{
    const uri = url.parse(req.url).pathname.replace('.jpeg','')
    try{
        const path = await checkFileAsync(uri)
        streamFile(res, path)
    }catch(e){
        console.log(e)
        return res.status(404).send('not found')
    }
}

const streamFile = (res, path) =>{
    const stream = fs.createReadStream(path)
        .on('open', ()=>{
            res.writeHead(200, {"Content-Type": "image/jpeg"})
            stream.pipe(res)
        })
        .on('error',(err)=> res.end(err))
    return stream
}

const checkFileAsync = (uri) => new Promise((resolve, reject) =>{
    const dir = __dirname+"/../resource/image"+uri+".jpeg"
    fs.stat(dir, (err,stats) => err ? reject(err) : resolve(dir) )
})

router.get('/', base)
router.get('/*', getImageByURI)
/*
router.get('/*',(req,res)=>{
    const parsedUrl = url.parse(req.url)
    const resource = parsedUrl.pathname
    const resourcePath = __dirname+"/../resource/music"+resource+".mp4"
    console.log(resourcePath)
    return res.send(resourcePath)
    var range = req.headers.range
    if(!range)
            return res.sendStatus(416)
    var position = range.replace(/bytes=/,"").split("-")
    var start = parseInt(position[0],10)
    fs.stat(resourcePath, (err,stats)=>{
        if(err){
            res.writeHead(500, {'Content-Type':'text/html'})
            return res.end(err)
        }
        var total = stats.size
    //    var _end = start+65535 > total ? total-1 : start+65536
        var end = position[1] ? parseInt(position[1],10): total-1
        var chunksize = (end-start) + 1
        res.writeHead(206,{
                "Content-Range":        "bytes "+start+"-"+end+"/"+total,
                "Accept-Range":         "bytes",
                "Content-Length":       chunksize,
                "Content-Type":         "video/mp4"
        })

        const stream = fs.createReadStream(resourcePath, { start, end} )
                .on("open",()=>{
                        stream.pipe(res)
                }).on("error",(err)=>{
                        res.end(err)
                })

    })
})
*/
module.exports = router