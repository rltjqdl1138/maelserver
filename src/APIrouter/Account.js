const router = require('express').Router()
const jwt = require('../Crypto/jwt')
const db = new (require('../Database/account'))('localhost', 2424, 'Account')
const axios = require('axios')


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
const SignupOriginal = async (payload) => {
    {success:true}
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
        const token = await jwt.code({id, name})
        return {success:true, id, name, token}
    }catch(e){
        console.log(e)
        return {success:false}
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
                result = mobileInToken && countryCodeInToken && mobileInToken == mobile && countryCodeInToken === countryCode ?
                    await SignupOriginal({id, password, name, mobile, countryCode, birthday, mobileInToken, countryCodeInToken}) :
                    {success:false, msg:'token'}
                break

            case 'facebook':
                result = await SignupFacebook({id, name, fbtoken})
                break
            case 'google':
            case 'apple':
            default:
                return res.json({success:false, msg:'platform'})
        }
        return res.json({success:result.success, data:result})
    })()
}

router.get('/checkid', checkID)
router.use('/*', jwt.middleware)
router.post('/register', Signup)

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