const db = require('./index')
const AccountClass = {
    "original":'Account',
    "facebook":'FBAccount'
}
class AccountDB extends db{
    constructor(host, port, usage){
        super(host, port, usage)
    }

    getAccountByID = async (id, platform)=>{
        const {dbSession} = this
        const account = await dbSession.query(`Select * from ${AccountClass[platform]} where id=:id`,{params:{id}}).all()
        // GET Account Information
        switch(account.length){
            case undefined:
            case null:
                return {success:false, msg:'DB Error'}
            case 0:
                return {success:true, data:null}
            case 1:
                break
            default:
                console.log('warning, account overlaped')
        }
        return {success:true, data:account[0]}
    }

    getAccountByMobile = async(mobile, countryCode)=>{
        const {dbSession} = this
        // GET User Information
        const user = await dbSession.query('Select * from User where mobile=:mobile and countryCode=:countryCode',{params:{mobile, countryCode}}).all()
        switch(user.length){
            case undefined:
            case null:
                return {success:false, msg:'DB Error'}
            case 0:
                return {success:true, data:null}
            case 1:
                break
            default:
                console.log('warning, User overlaped')
        }

        // GET Account Information
        const account = await dbSession.query(`Select * from Account where UID=:UID`,{params:{UID:user[0].UID}}).all()
        switch(account.length){
            case undefined:
            case null:
                return {success:false, msg:'DB Error'}
            case 0:
                return {success:true, data:user[0]}
            case 1:
                break
            default:
                console.log('warning, User overlaped')
        }
        return {success:true, data:{...account[0], ...user[0]}}

    }

    getUserByID = async(id, platform)=>{
        const {dbSession} = this
        // GET Account Information
        const account = await dbSession.query(`Select * from ${AccountClass[platform]} where id=:id`,{params:{id}}).all()
        switch(account.length){
            case undefined:
            case null:
                return {success:false, msg:'DB Error'}
            case 0:
                return {success:true, data:null}
            case 1:
                break
            default:
                console.log('warning, account overlaped')
        }

        // GET User Information
        const user = await dbSession.query('Select * from User where UID=:UID',{params:{UID:account[0].UID}}).all()
        switch(user.length){
            case undefined:
            case null:
                return {success:false, msg:'DB Error'}
            case 0:
                return {success:true, data:null}
            case 1:
                break
            default:
                console.log('warning, User overlaped')
        }
        return {success:true, data:{...account[0], ...user[0]}}
    }

    getUserByMobile = async(mobile, countryCode)=>{
        const {dbSession} = this
        // GET User Information
        const user = await dbSession.query('Select * from User where mobile=:mobile and countryCode=:countryCode',{params:{mobile, countryCode}}).all()
        switch(user.length){
            case undefined:
            case null:
                return {success:false, msg:'DB Error'}
            case 0:
                return {success:true, data:null}
            case 1:
                break
            default:
                console.log('warning, User overlaped')
        }
        return {success:true, data:user[0]}
    }
    
    registerAccount = async({id, password, platform, UID})=>{
        const {dbSession} = this
        let query;
        try{
            // Check overlaped : id
            const check = await dbSession.query(`Select * from ${AccountClass[platform]} where id=:id`,{params:{id}}).all()
            console.log(check)
            if(check.length !== 0)
                throw Error('overlaped')

            // Set Query
            switch(platform){
                case 'original':
                    query = `Insert into Account set id=:id, password=:password, UID=:UID`
                    break;
                case 'facebook':
                    query = `Insert into FBAccount set id=:id, UID=:UID`
                    break;
                default:
                    query = null
            }
            // Create Account
            const account = query ? await dbSession.command(query,{params:{id, password, UID}}).all() : null
            account ? console.log(`[Database] Create Account on ${platform} : ID:${id}`) : null
            return {success: true} 
        } catch(e){
            return {success: false}
        }
    }

    registerUser = async(_payload)=>{
        const {dbSession} = this
        const {name, mobile, countryCode, birthday, email} = _payload
        const stateID = 0
        const UID = 3;
        try{
            // Check overlaped : mobile
            const check = mobile ? await dbSession.query('Select * from User where mobile=:mobile',{params:{mobile}}).all() : null
            if(mobile && check.length !== 0)
                throw Error('overlaped')

            // Create User
            const a = await dbSession.command(
                'Insert into User set UID=:UID, name=:name, mobile=:mobile, countryCode=:countryCode, birthday=:birtyday, email=:email, stateID=:stateID',
                {params:{UID, name, mobile, countryCode, birthday, email, stateID}}
            ).all()
            console.log(a)
            console.log(`[Database] Create User ${UID}`)
            return {success:true, UID}
        }catch(e){
            return {success:false}
        }
    }
}

/*

create PROPERTY User.UID INTEGER ( MANDATORY TRUE );
create PROPERTY User.name STRING
create PROPERTY User.stateID BYTE ( MANDATORY TRUE );
create PROPERTY User.lastToken STRING;
create PROPERTY User.mobile STRING;
create PROPERTY User.countryCode INTEGER
create PROPERTY User.birthday STRING
create PROPERTY User.email STRING
*/
module.exports = AccountDB