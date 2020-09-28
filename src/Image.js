const router = require('express').Router()
const url = require('url')
const multiparty = require('multiparty')
const fs = require('fs')
const db = new (require('./Database/resource'))('localhost', 2424, 'Image Resource')
const __Resource = __dirname+'/../resource'

const base = async (req, res) => {
    try{
        const path = await checkFileAsync('/no name.png')
        streamFile(res, path)
    }catch(e){
        console.log(e)
        return res.status(404).send('not found')
    }
}
const uploadImageFile = async(req,res)=>{
    const form = new multiparty.Form();
    const nowTime = Date.now()

    form.on('error', (err)=>{
        console.log(`[Error] form on err`)
        console.log(err)
    })
    form.on('part', (part)=>{
        if(!part.filename || part.filename === ''){
            part.resume()
            return;
        }
        const filename = part.filename && typeof part.filename === 'string' ? part.filename.replace(/ /gi,"") : 'Image'+String(nowTime)
        console.log(`Upload image... ${part.filename} => ${filename}`)

        const writeStream = fs.createWriteStream(`${__Resource}/image/${filename}`);
        writeStream.filename = filename
        part.pipe(writeStream);
        part.on('end',()=> {
            console.log("[Media] Write Image file :" + filename);
            writeStream.end()
            res.status(200).send(filename)
        } )
    })
    form.parse(req)

}

const getImageByURI = async (req, res)=>{
    const uri = url.parse(req.url).pathname
    try{
        const path = await checkFileAsync(uri)
        streamFile(res, path)
    }catch(e){
        console.log(e)
        return res.status(404).send('not found')
    }
}
const getBannerURIs = (req, res)=>{
    return res.json({success:true, uri:`/image/banner/sample.jpeg`})
}
const getBannerByURI = async (req, res)=>{
    const uri = url.parse(req.url).pathname
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
    const dir = __dirname+"/../resource/image"+uri
    fs.stat(dir, (err,stats) => err ? reject(err) : resolve(dir) )
})
router.get('/banner', getBannerURIs)
router.get('/banner/*', getBannerByURI)
router.post('/',uploadImageFile)
router.get('/', base)
router.get('/*', getImageByURI)
module.exports = router