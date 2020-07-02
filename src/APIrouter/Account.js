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
const SignupGoogle = async({uid, email, displayName, auth})=>{
    /*
    console.log(uid)
    admin.auth().getUser(uid)
        .then(function(userRecord) {
        // See the UserRecord reference doc for the contents of userRecord.
            console.log('Successfully fetched user data:', userRecord.toJSON());
        })
        .catch(function(error) {
            console.log('Error fetching user data:', error);
        });
    return {success:false}
        */
    
    admin.auth().verifyIdToken(auth.idToken)
        .then( decodedToken => {
            console.log('2')
            console.log(decodedToken)
            let uid = decodedToken.uid;
            console.log(uid)
            // ...
        }).catch(function(error) {
            // Handle error
            console.log('error')
            console.log(error)
        });
    return {success:false}
}
const Signup = (req,res)=>{
    console.log(req.body.user)
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
            createDate: `${date.getFullYear()}년 ${date.getMonth()}월 ${date.getDay()}일`
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
    const {name, birthday} = req.query
    const {mobile, countryCode} = req.decoded
    const response = await db.getAccountByMobile(mobile, countryCode)
    if(!response.success || !response.data || !response.data.id)
        return res.json({success:true})
    else if(response.data.id)
        return res.json({success:true, id:response.data.id})
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
    const {mobile, countryCode} = req.decoded
    const {id, password} = req.body

    const account = await db.getAccountByMobile(mobile, countryCode)
    if(!account.success || !account.data || account.data.id !== id)
        return res.json({success:false})

    const hash = password
    //todo: hashing
    const result = await db.updateUser(account.data.UID, {key:'password', value:hash})
    return res.json(result)
}


// Need no token
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

/*

[POST]	/account/original		회원가입
	(id, password, name, mobile, countryCode, birthday, token)	=>	(token)
[POST]	/account/facebook		회원가입
	(id, name, fbtoken)	=>	(token)
[GET]	/account		정보 조회
	(type:user / account)	=>	
[GET]	/account/check
	( id )		=>	(success)
[POST]	/account/find
	(mtoken, name)	=>	(success, id)
[PUT]	/account/password	비밀번호 변경
	(password)	=>	(success)
[PUT]	/account/email	이메일 변경
	(email)	=>	(success)
[PUT]	/account/mobile	핸드폰번호 변경
	(mobile,mtoken)	=>	(success)
[PUT]	/account/birthday	생년월일 변경
	(birthday)	=>	(success)
*/