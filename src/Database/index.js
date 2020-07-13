const OrientDBClient = require("orientjs").OrientDBClient;

// DB Configuration
const DB_NAME = 'mael'
const DB_USER = 'root'
const DB_PASS = '1138877'
const option = {
    name: DB_NAME,
    username:DB_USER,
    password:DB_PASS
}

class dbModel{
    constructor(host="localhost", port=2424, usage='Basic'){
        this.initializeDB(host, port, usage)
    }
    initializeDB = async(host, port, usage)=>{
        try{
            this.db = await OrientDBClient.connect({host, port})
            this.dbSession = await this.db.session(option);
            this.logWithTime(`[Database] Initialize success ${host}:${port} for \x1b[97m${usage}\x1b[0m`)
        }
        catch(e){
            this.logWithTime('[Database] \x1b[31mInitialization Error\x1b[0m')
            this.dbSession ? this.dbSession.close() : this.logWithTime(`DB Client is not created (NAME:${DB_NAME} USER:${DB_USER} PASSWORD:${DB_PASS})`)
            this.db ? this.db.close() : this.logWithTime(`\x1b[31mDB Session is not created\x1b[0m (${host}:${port})`)
        }
    }
    logWithTime = (text)=>{
        const LogDate = new Date()
        console.log(`\x1b[96m${LogDate.getFullYear()}.${this.formating(LogDate.getMonth()+1)}.${this.formating(LogDate.getDate())} ${this.formating(LogDate.getHours())}:${this.formating(LogDate.getMinutes())}:${this.formating(LogDate.getSeconds())}\x1b[0m ${text}`)
    }
    secondToString = (_time)=>{
        const rawtime = Math.floor(_time)
        const min = Math.floor(rawtime/60)
        const second = rawtime % 60
        return `${this.formating(min)}:${this.formating(second)}`
    }
    formating=(number) => `${number < 10 ? '0':''}${number}`
}

module.exports = dbModel