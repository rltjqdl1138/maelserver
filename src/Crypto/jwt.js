const jwt = require('jsonwebtoken')

const db = new (require('../Database/account'))('localhost', 2424, 'JWT')

// JWT Configuration
const HEADER_KEY  = 'x-access-token'
const JWT_KEY = 'mael'
const JWT_OPTION = {
    issuer:'mael.com'
}

// create token Async
const signToken = ( payload ) =>
    new Promise( (resolve, reject) =>
        jwt.sign(payload, JWT_KEY, JWT_OPTION,
            (err, token) => err ? reject(err) : resolve(token)
))

// decode token Async
const verifyToken = (token) =>
    new Promise( (resolve, reject)=>
        jwt.verify( token, JWT_KEY,
            (err, decoded)=> err ? reject(err) : resolve(decoded)

))

const middleware = (req, res, next) =>{
    const token = req.headers[HEADER_KEY] || req.query.token;
    (async()=>{
        try{
            const decoded = token ? await verifyToken(token) : null
            if(decoded && decoded.id && decoded.platform){
                const account = await db.getUserByID(decoded.id, decoded.platform)
                if(account.success && account.data && account.data.stateID)
                    req.stateID = account.data.stateID
            }
            req.token = token
            req.decoded = decoded
            next()
        }catch(e){
            res.status(400).json({success:false, message:'Unsigned token'})
        }
    })()
}


exports.code = signToken
exports.decode = verifyToken
exports.middleware = middleware