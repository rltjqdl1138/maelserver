const db = require('./index')

class NoticeDB extends db{
    constructor(host, port, usage){
        super(host, port, usage)
    }
    getNotice = async()=>{
        try{
            const response = await this.dbSession.query('Select * from Notice Order By createdTime DESC').all()
            return {success:true, data:response}
        }catch(e){
            return {success:false}
        }
    }
    registerNotice = async(title, main)=>{
        try{
            const createdTime = Date.now()
            const response = await this.dbSession.command(`Insert Into Notice set ID=sequence('noticeIDseq').next(), title=:title, main=:main, createdTime=:createdTime`,{params:{title, main, createdTime}}).one()
            return {success:true, data:response}
        }catch(e){
            return {success:false}
        }
    }
}




module.exports = NoticeDB
