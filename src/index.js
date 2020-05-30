const router = require('express').Router()

router.get('/',(req, res)=>{
    res.send('welcom mael')
})
router.get('/music',(req, res)=>{
    res.send('welcom music')
})
router.get('/image',(req, res)=>{
    res.send('welcom image')
})
router.get('/api',(req, res)=>{
    res.send('welcom api')
})
router.post('/*',(req, res)=>{
    console.log(req.headers)
    console.log(req.body)
    res.end('h')
})

const { MessageService } = require('./Services/naverCloud')
const messageService = new MessageService()
router.get('/test',(req, res)=>{
    (async ()=>{
        const a = await messageService.sendMessage('82','01066626386')
        console.log(a)
        res.end(a.key)
    })()
})




module.exports = router