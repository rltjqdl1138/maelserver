const router = require('express').Router()
const jwt = require('../Crypto/jwt')
const db = new (require('../Database/account'))('localhost', 2424, 'Account')
const axios = require('axios')
const admin = require('firebase-admin');
const serviceAccount = require('../../security/serviceAccountKey.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://mael-play-test.firebaseio.com"
})

const checkID = (req, res) =>{
    const {id, platform} = req.query;
    if(!id || typeof id !== 'string' || !platform || typeof platform !== 'string')
        return res.json({success:false, msg:'input'});
    (async()=>{
        const result = await db.getAccountByID(id, platform)
        return !result.success ? res.json({success:false}) :
            res.json({success: true, overlaped: result.data ? true : false})
    })()
}

const checkForgetID = (req, res) =>{
    const {name, birthday} = req.query;
    if(!name || typeof name !== 'string' || !birthday || typeof birthday !== 'string')
        return res.json({success:false, msg:'input'});
    (async()=>{
        const result = await db.getUserByNameAndBirth(name, birthday)
        return !result.success ? res.json({success:false}) :
            res.json({success: true, length: result.data.length})
    })()
}

const SignupOriginal = async ({id, password, name, mobile, countryCode, birthday, mobileInToken, countryCodeInToken}) => {
    try{
        //Check overlaped
        const check = await db.getAccountByID(id, 'original')
        if(!check.success || check.data)
            throw Error('overlaped')
        
        // Create User
        const user = await db.registerUser({name, mobile, countryCode, birthday})
        if(!user.success)
            throw Error('user')

        // Create Account
        // TODO: hash password
        const hash = password
        const account = await db.registerAccount({id, password:hash, platform:'original', UID:user.UID})
        if(!account.success)
            throw Error('Account')
        
        // Sign token
        const token = await jwt.code({id, name, platform:'original'})
        return {success:true, id, name, token}
    }catch(e){
        return {success:false, msg:e}
    }
}
const SignupFacebook = async (payload) => {
    const {id, name, fbtoken} = payload
    const URL = `https://graph.facebook.com/me?access_token=${fbtoken}`
    try{
        //Check facebook token
        const fbResponse = await axios.get(URL)
        if(id !== fbResponse.data.id || name !== fbResponse.data.name)
            throw Error('not match')

        // Create User
        const user = await db.registerUser({name})
        if(!user.success)
            throw Error('user')

        // Create Account
        const account = await db.registerAccount({id, platform:'facebook', UID:user.UID})
        if(!account.success)
            throw Error('Account')
        
        // Sign token
        const token = await jwt.code({id, name, platform:'facebook'})
        return {success:true, id, name, token}
    }catch(e){
        console.log(e)
        return {success:false}
    }
}
const SignupGoogle = async({uid, email, displayName})=>{
    try{
        //Check overlaped
        const check = await db.getAccountByID(uid, 'google')
        if(!check.success || check.data)
            throw Error('overlaped')

        // Create User
        const user = await db.registerUser({name:displayName, email})
        if(!user.success)
            throw Error('user')
        // Create Account
        const account = await db.registerAccount({id:uid, platform:'google', UID:user.UID})
        if(!account.success)
            throw Error('Account')
        // Sign token
        const token = await jwt.code({id:uid, name:displayName, platform:'google'})
        
        return {success:true, id:uid, name:displayName, token}
    }catch(e){
        return {success:false, msg:e.message}
    }
}
const Signup = (req,res)=>{
    const {id, password, name, mobile, countryCode, birthday, platform, fbtoken} = req.body;
    const mobileInToken = req.decoded ? req.decoded.mobile : null
    const countryCodeInToken = req.decoded ? req.decoded.countryCode : null
    let result;

    (async()=>{
        switch(platform){
            case 'original':
                //Check mobile Authentication is verified
                result = mobileInToken && countryCodeInToken && mobileInToken === mobile && countryCodeInToken === countryCode ?
                    await SignupOriginal({id, password, name, mobile, countryCode, birthday, mobileInToken, countryCodeInToken}) :
                    {success:false, msg:'token'}
                break

            case 'facebook':
                result = await SignupFacebook({id, name, fbtoken})
                break

            case 'google':
                if(!req.body.user)
                    return res.json({success:false, msg:'user'})
                result = await SignupGoogle(req.body.user)
                break

            case 'apple':
            default:
                return res.json({success:false, msg:'platform'})
        }
        return res.json({success:result.success, data:result})
    })()
}

const getAccount = async (req, res)=>{
    const {id, platform} = req.decoded
    try{
        const user = await db.getUserByID(id, platform)
        if(!user.success || !user.data)
            return res.json({success:true})
        let ID;
        switch(platform){
            case 'facebook':
                ID = '페이스북 아이디';break
            case 'google':
                ID = '구글 아이디';break
            case 'apple':
                ID = '애플 아이디';break
            default:
                ID = id
        }
        const date = new Date(user.data.createdTime)
        const payload = {
            id: ID,
            stateID: user.data.stateID,
            createDate: `${date.getFullYear()}년 ${date.getMonth()+1}월 ${date.getDate()}일`
        }
        res.json({success:true, data:payload})
    }
    catch(e){
        console.log(e)
        res.json({success:true, data:{}})
    }
}

const getUser = async (req, res)=>{
    const {id, platform} = req.decoded
    try{
        const user = await db.getUserByID(id, platform)
        if(!user.success || !user.data)
            return res.json({success:true})
        const payload = {
            name:user.data.name ? user.data.name : '',
            birthday:user.data.birthday ? user.data.birthday : '',
            mobile:user.data.mobile ? user.data.mobile : ''
        }
        res.json({success:true, data:payload})
    }
    catch(e){
        console.log(e)
        res.json({success:true, data:{}})
    }
}

const forgetID = async (req, res)=>{
    if(!req.decoded)
        return res.json({success:false})
    const {name, birthday, id} = req.query
    const {mobile, countryCode} = req.decoded
    const response = await db.getAccountByMobile(mobile, countryCode)

    // Case 1:
    // 가입된 정보 없음
    if(!response.success || !response.data )
        return res.json({success:false})

    // Case 1-2:
    // User 정보는 있으나 id가 없음 (Social login)
    else if(!response.data.id && response.data.name === name && response.data.birthday === birthday)
        return res.json({success:true})

    const token = await jwt.code({id:response.data.id, name:response.data.name, platform:'original'})


    // Case 2-1:
    // 아이디 찾기
    if(response.data.name === name && response.data.birthday === birthday)
        return res.json({success:true, id:response.data.id, token})
    
    // Case 2-2:
    // 비밀번호 찾기
    else if(response.data.id === id)
        return res.json({success:true, id, token})

    // Other cases:
    return res.json({success:false})
}


const changeInfo = async (req, res)=>{
    if(!req.decoded)
        return res.json({success:false})
    const {id, platform} = req.decoded
    const key = req.url.split('/')[2]
    let value = req.body[key]

    const account = await db.getAccountByID(id, platform)
    if(!account.success || !account.data)
        return res.json({success:false})

    // Pre processing
    switch(key){
        case 'mobile':
            const decoded = await jwt.decode(req.body.mobileToken)
            if(decoded.mobile !== req.body.mobile || decoded.countryCode !== req.body.countryCode)
                return {success:false}
            break;

        case 'password':
            const hash = req.body.oldPassword
            if(hash !== account.data.password)
                return res.json({success:false, isnotCorrect:true})
            //todo: hashing
            
            value = value
            break;

        default:
    }
    const result = await db.updateUser(account.data.UID, {key, value})
    return res.json(result)
}


const resetPassword = async (req, res)=>{
    if(!req.decoded)
        return res.json({success:false})
    const {id} = req.decoded
    const {password} = req.body
    const account = await db.getAccountByID(id, 'original')
    if(!account.success || !account.data || account.data.id !== id)
        return res.json({success:false})

    const hash = password
    //todo: hashing
    const result = await db.updateUser(account.data.UID, {key:'password', value:hash})
    return res.json(result)
}
const getAccountData = async(req,res)=>{
    let result = []
    const account = await db.getAccount()
    const user = await db.getUser()
    account.data.original.map(item=>result = [...result, {...item, ...user.data[String(item.UID)], platform:'original'}])
    account.data.facebook.map(item=>result = [...result, {...item, ...user.data[String(item.UID)], platform:'facebook'}])
    account.data.google.map(item=>result = [...result, {...item, ...user.data[String(item.UID)], platform:'google'}])
    
    return res.json({success:true, data:result})
}

// Need no token

router.get('/',getAccountData)
router.get('/check/id', checkID)
router.get('/check/forgetid', checkForgetID)

// Need token
router.use('/*', jwt.middleware)
router.post('/register', Signup)
router.get('/account',getAccount)
router.get('/user',getUser)
router.put('/user/*',changeInfo)
router.get('/forgetid', forgetID)
router.put('/forgetid', resetPassword)
module.exports = router