const db = require('./index')
class AnalyticsDB extends db{
    constructor(host, port, usage){
        super(host, port, usage)
    }
    getUserLog = async({uid, beginTime, endTime})=>{
        const where = (uid ? ` uid=${uid} and` : '') + (beginTime ? ` time>=${beginTime} and` : '') + (endTime ? ` time<${endTime} and` : '')
        const query = 'Select time, uid, prevStatus, currentStatus from UserStatusLog' + (where.length ? ` where${where.slice(0,where.length-4)}` : '')
        return await this.dbSession.query(query+' order by time').all()
    }
}


module.exports = AnalyticsDB