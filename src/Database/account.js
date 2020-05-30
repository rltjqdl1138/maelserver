const db = require('./index')
const AccountClass = {
    "original":'Account',
    "facebook":'FBAccount'
}
class AccountDB extends db{
    constructor(host, port, usage){
        console.log(host, port, usage)
        super(host, port, usage)
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
                console.log('warning, account overlaped')
        }
        return {success:true, data:{...account[0], ...user[0]}}
    } 
}

module.exports = AccountDB