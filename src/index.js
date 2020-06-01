const router = require('express').Router()
const APIRouter = require('./APIrouter')

router.get('/',(req, res)=>{
    console.log('hello')
    res.json({msg:'welcom mael'})
})

router.use('/api', APIRouter )

router.get('/music',(req, res)=>{
    res.send('welcom music')
})
router.get('/image',(req, res)=>{
    res.send('welcom image')
})


//const { MessageService } = require('./Services/naverCloud')
//const messageService = new MessageService()
//const a = await messageService.sendMessage('82','01066626386')


module.exports = router