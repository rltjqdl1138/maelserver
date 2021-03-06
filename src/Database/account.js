const db = require('./index')
const AccountClass = {
    "original":'Account',
    "facebook":'FBAccount',
    "google":'GGAccount',
    "apple":'APAccount'
}
class AccountDB extends db{
    constructor(host, port, usage){
        super(host, port, usage)
    }
    getAccount = async (platform)=>{
        const {dbSession} = this
        let account
        if(platform)
            account = await dbSession.query(`Select * from ${AccountClass[platform]}`).all()
        else{
            account = {}
            account.original = await dbSession.query(`Select * from Account`).all()
            account.facebook = await dbSession.query(`Select * from FBAccount`).all()
            account.google = await dbSession.query(`Select * from GGAccount`).all()
            account.apple = await dbSession.query(`Select * from APAccount`).all()
        }
        return {success:true, data:account}
    }
    getUser = async ()=>{
        const {dbSession} = this
        const user = await dbSession.query('Select * from User').all()
        let data = []
        user.map(item=>{ data[String(item.UID)] = item })
        return {success:true, data}
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

    getUserByNameAndBirth = async(name, birthday)=>{
        const {dbSession} = this
        // GET User Information
        const user = await dbSession.query('Select * from User where name=:name and birthday=:birthday',{params:{name, birthday}}).all()
        return {success:true, data:user}
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
                case 'google':
                    query = `Insert into GGAccount set id=:id, UID=:UID`
                    break;
                case 'apple':
                    query = `Insert into APAccount set id=:id, UID=:UID`
                    break;
                default:
                    query = null
            }
            // Create Account
            const account = query ? await dbSession.command(query,{params:{id, password, UID}}).all() : null
            account ? this.logWithTime(`[Database] Create Account on ${platform} : ID:${id}`) : null
            return {success: true} 
        } catch(e){
            return {success: false}
        }
    }

    registerUser = async(_payload)=>{
        const {dbSession} = this
        const {name, mobile, countryCode, birthday, email} = _payload
        const stateID = 0
        try{
            // Check overlaped : mobile
            const check = mobile ? await dbSession.query('Select * from User where mobile=:mobile',{params:{mobile}}).all() : null
            if(mobile && check.length !== 0)
                throw Error('overlaped')
            // Create User
            const nowTime = Date.now()
            const a = await dbSession.command(
                `Insert into User set UID=sequence('userIDseq').next(), name=:name, mobile=:mobile, countryCode=:countryCode, birthday=:birthday, email=:email, stateID=:stateID, createdTime=:nowTime, updatedTime=:nowTime`,
                {params:{name, mobile, countryCode, birthday, email, stateID, nowTime}}
            ).all()
            await dbSession.command(
                `Insert into UserStatusLog set uid=:uid, prevStatus=-1, currentStatus=0, time=:time`,{
                    params: {uid:a[0].UID, time: nowTime}}
            ).one()
            this.logWithTime(`[Database] Create User ${a[0].UID}`)
            return {success:true, UID:a[0].UID}
        }catch(e){
            return {success:false}
        }
    }
    
    updateUser = async(UID, payload)=>{
        const {dbSession} = this
        const {key, value} = payload
        try{
            switch(key){
                // * Update Account *
                case 'password':
                    await dbSession.command(`Update Account set ${key}=:value where UID=${UID}`,{params:{value}}).all()
                    this.logWithTime(`[Database] Update Account ${UID}:  <${key}> ${value}`)
                    return {success:true}

                // * Check overlaped *
                case 'mobile':
                    const mobile = await dbSession.query(`Select * from User where mobile=:mobile`,{params:{mobile:value}}).all()
                    if(mobile.length > 0)
                        return {success:false, overlaped:true}
                case 'stateID':

                    const nowTime = Date.now()
                    const stateID = await dbSession.query(`Select * from User where UID=:UID`,{params:{UID}}).all()
                    if(!stateID.length)
                        return {success:false}
                    await dbSession.command('Insert into UserStatusLog set uid=:uid, prevStatus=:prevStatus, currentStatus=:currentStatus, time=:time',{
                        params:{uid:UID, prevStatus:stateID[0].stateID, currentStatus:value, time:nowTime} })
                default:
                    break;
            }
            const result = await dbSession.command(`Update User set ${key}=:value where UID=${UID}`,{params:{value}}).all()
            this.logWithTime(`[Database] Update User ${UID}:  <${key}> ${value}`)
            return {success:true, result}
        }catch(e){
            console.log(e)
            return {success:false}
        }
    }
    deleteUser = async (UID, platform, reason)=>{
        const {dbSession} = this
        try{
            const nowTime = Date.now()
            await dbSession.command(`Delete from User where UID=:UID`, {params:{UID}}).all()
            await dbSession.command(`Delete from ${AccountClass[platform]} where UID=:UID`,{params:{UID}}).all()

            await dbSession.command(
                `Insert into UserStatusLog set uid=:uid, prevStatus=0, currentStatus=-1, time=:time, reason=:reason`,{
                    params: {uid:UID, time: nowTime, reason}}
            ).one()
            this.logWithTime(`[Database] Delete User ${UID}`)
        }catch(e){
            console.log(e)
        }
    }
    getReceiptsByOriginalTransactionId = async (id)=>{
        return (await this.dbSession.query('Select * From Subscription where originalTransactionId=:id',{params:{id}}).one())
    }
    createReceipt = async(payload)=>{
        try{
            await this.dbSession.command(`INSERT INTO Subscription SET app=:app, userId=:userId, originalTransactionId=:originalTransactionId, validationResponse=:validationResponse, latestReceipt=:latestReceipt, startDate=:startDate, endDate=:endDate, isCancelled=:isCancelled, productId=:productId, isExpired=:isExpired`,{params:payload}).one()
            return true
        }catch(e){
            console.log(e)
            return false
        }  
    }
}

module.exports = AccountDB