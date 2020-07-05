const router = require('express').Router()
const axios = require('axios')
const jwt = require('../Crypto/jwt')
const db = new (require('../Database/account'))('localhost', 2424, 'Auth')
const {MessageService} = require('../Services/naverCloud')
const CountryCodeList = require('./CountryCode.json')
const message = new MessageService()

const SignCheck = (req, res)=>{
    switch(true){
        case !req.decoded:
        case !req.token:
        case req.token === '':
            return res.status(400).json({success:false, msg:'need to token'})
        case !req.decoded.id:
        case !req.decoded.name:
        case !req.decoded.platform:
        case typeof req.decoded.id !== 'string':
        case typeof req.decoded.name !== 'string':
        case typeof req.decoded.platform !== 'string':
        case req.decoded.id.length < 8:
            return res.status(400).json({success:false, msg:'this token is not for sign check'})

        default:
            return res.json({success:true})
    }
}
const SignIn = (req, res)=>{
    const {id, password, platform, fbtoken, user} = req.body;
    
    //Check id
    if(!id || typeof id !== 'string' || id===''){
        //console.log(`[Sign In] Fault missing ID`)
        return res.status(400).json({success:false, msg:'ID'})
    }
    //Check Platform
    switch(platform){
        case 'original':
            //Check Password
            if(!password || typeof password !== 'string'){
                //console.log(`[Sign In] Fault ID:${id} missing password`)
                return res.status(400).json({success:false, msg:'password'})
            }
            break

        case 'facebook':
            //Check Token
            if(!fbtoken || typeof fbtoken !== 'string'){
                //console.log(`[Sign In] Fault ID:${id} missing facebook token`)
                return res.status(400).json({success:false, msg:'fbtoken'})
            }
            break

        case 'google':
            if(!user || !user.uid)
                return res.status(400).json({success:false, msg:'uid'})
            //Need to authentication
            break
        case 'apple':
            //break
        default:
            //console.log(`[Sign In] Fault ID:${id} missing platform`)
            return res.status(400).json({success:false, msg:'platform'})
    };
    (async()=>{
        //TODO: password to hash
        const hash = password

        // Get User data
        const result = await db.getUserByID(id, platform)
        if(!result.success){
            //console.log(`[Sign In] Fault ID:${id} no data`)
            return res.status(400).json(result)
        }
        // Create JWT
        const payload = result.data ? {id:result.data.id, name:result.data.name, platform} : null
        const token = payload ? await jwt.code(payload) : null
        if(!token)
            return res.json({success:false})
        switch(platform){
            case 'original':
                //Check password is matched
                if(hash !== result.data.password){
                    //console.log(`[Sign In] Fault ID:${id} platform:${platform}`)
                    return res.status(400).json({success:false, msg:'password'})
                }
                break;
            case 'facebook':
                try{
                    //Check facebook token
                    const URL = `https://graph.facebook.com/me?access_token=${fbtoken}`
                    await axios.get(URL)
                }catch(e){
                    //console.log('facebook token Authentication error')
                    return res.json({success:false, data : null})
                }
                break;
            case 'google':

                break;
            default:
                return res.json({success:false, msg:'platform'})
        }
        console.log(`[Sign In] ID:${id} platform:${platform}`)
        return res.json({success:true, data:{...payload, token}})
    })()
}

const messageCheck = (req, res)=>{
    const {mobile, countryCode, key} = req.query
    switch(true){
        case !mobile:
        case !key:
            return res.json({success:false, msg:'input'})
    }

    //Check Key
    (async()=>{
        const codeCheck = countryCode && CountryCodeList[countryCode] ? countryCode : '82'
        const token = message.checkKey(codeCheck, mobile, key) ? await jwt.code({mobile, countryCode:codeCheck}) : null
        return res.json({success: token?true:false, token})
    })()
}

const sendMessage = (req, res)=>{
    const {mobile, countryCode} = req.body
    // Request Check
    const mobileCheck = mobile && typeof mobile === 'string' ? mobile.replace(/[00-9]/g,'').length : 1
    const codeCheck = countryCode && CountryCodeList[countryCode] ? countryCode : '82'
    if(mobileCheck > 0 || mobile.length < 10 || mobile.length > 11)
        return res.json({success:false, msg:'mobile number'});

    // Send Message
    (async()=>{
        const {success} = await message.sendMessage(codeCheck, mobile)
        res.json({success})
    })()
}

const getCountryCode = (req, res)=>{
    const list = Object.keys(CountryCodeList).map(item=>(
        {code:item, name:CountryCodeList[item]}
    ))
    res.json({success:true, list})
}


//Authentication Middleware
router.use('/*', jwt.middleware)

//Sign Authentication
router.get('/', SignCheck)
router.post('/', SignIn)

//Mobile Authentication
router.get('/message', messageCheck)
router.post('/message', sendMessage)
router.get('/countrycode', getCountryCode)



module.exports = router