const jwt = require('jsonwebtoken')

// JWT Configuration
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

const verifyToken = (token) =>
    new Promise( (resolve, reject)=>
        jwt.verify( token, JWT_KEY,
            (err, decoded)=> err ? reject(err) : resolve(decoded)

))


exports.code = signToken
exports.decode = verifyToken