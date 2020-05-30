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
            console.log(`[Database] Initialize success \nDataBase on ${host}:${port} for \x1b[97m${usage}\x1b[0m`)
        }
        catch(e){
            console.log('[Database] \x1b[31mInitialization Error\x1b[0m')
            this.dbSession ? this.dbSession.close() : console.log(`DB Client is not created (NAME:${DB_NAME} USER:${DB_USER} PASSWORD:${DB_PASS})`)
            this.db ? this.db.close() : console.log(`\x1b[31mDB Session is not created\x1b[0m (${host}:${port})`)
        }
    }
}

module.exports = dbModel