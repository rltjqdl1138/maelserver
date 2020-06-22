const router = require('express').Router()
const APIRouter = require('./APIrouter')
const Music = require('./Music')
const Image = require('./Image')

router.get('/',(req, res)=>{
    res.json({msg:'welcom mael'})
})

router.use('/api', APIRouter )
router.use('/music', Music)
router.use('/image', Image)


//const { MessageService } = require('./Services/naverCloud')
//const messageService = new MessageService()
//const a = await messageService.sendMessage('82','01066626386')


module.exports = router