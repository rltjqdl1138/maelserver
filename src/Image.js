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
    form.on('part', (part)=>{
        const filename = part.filename.replace(/ /gi,"")
        if(!filename || filename===''){
            part.resume()
            return;
        }

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

router.post('/',uploadImageFile)
router.get('/', base)
router.get('/*', getImageByURI)
module.exports = router