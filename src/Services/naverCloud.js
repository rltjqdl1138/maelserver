const crypto = require('crypto')
const axios = require('axios')

exports.MessageService = class MessageService {
    // Naver Cloud Platform Configuration
    accessKey = 'ZfaNOWNh0VkkPrESHGUM'
    secretKey = '4p3yav4VwKhxEoQz65zq2cLt32TdWHuap7CO7YCQ'
    serviceID = 'ncp:sms:kr:258919818234:mael'
    callingNumber = '07077003045'
    // Naver Cloud Platform URL
    baseURL = 'https://sens.apigw.ntruss.com'
    url = `/sms/v2/services/${this.serviceID}/messages`

    //Authentication Var
    keyTable = {}

    makeSignature = async (method, _timestamp, url)=>{
        const timestamp = typeof _timestamp === 'string' ? _timestamp : String(_timestamp)

        return crypto.createHmac('sha256', this.secretKey)
            .update(method).update(" ")
            .update(url).update("\n")
            .update(timestamp).update("\n")
            .update(this.accessKey)
            .digest('base64')
    }

    sendMessage = async (countryCode, to)=>{
        // Random key Generate: 100,000 ~ 999,999
        const key = String( Math.floor( Math.random()*899999 + 100000 ) )

        //TODO: 서비스이름 확정되면 문구 변경
        const context = `[Mael 본인확인] 인증번호는 ${key} 입니다. 정확히 입력해주세요`

        // Coordinated Universal Time (UTC+0)
        const timestamp = await Date.now()

        // Header / Body For Naver cloud platform
        const signature = await this.makeSignature('POST', timestamp, this.url )
        const header = {
            'Content-Type':'application/json',
            'x-ncp-apigw-timestamp':timestamp,
            'x-ncp-iam-access-key':this.accessKey,
            'x-ncp-apigw-signature-v2':signature
        }

        const body = {
            "type":"SMS",
            "contentType":'COMM',
            "countryCode":countryCode,
            "from": this.callingNumber,
            "content":context,
            "messages":[{ to }]
        }

        try{
            await axios.post(this.baseURL+this.url, body, {headers:header})
            this.appendKey(countryCode, to, key)

            const LogDate = new Date()
            console.log(`\x1b[96m${LogDate.getFullYear()}.${LogDate.getMonth()+1}.${LogDate.getDate()} ${LogDate.getHours()}:${LogDate.getMinutes()}:${LogDate.getSeconds()}\x1b[0m [Naver Cloud] Message Send: \x1b[97m${countryCode}:${to}\x1b[0m\t${key}`)
            return {success:true, key}
        }catch(e){
            console.log(e.response ? e.response.error : e)
            return {success:false}
        }
    }

    checkKey = (countryCode, mobile, value)=>{
        const key = countryCode+'#'+mobile
        return value && value === this.keyTable[key]
    }
    appendKey = (countryCode, mobile, value)=>{
        const key = countryCode+'#'+mobile
        this.keyTable[key] = value
        setTimeout(() => this.deleteKey(countryCode, mobile, value), 180000)
    }
    deleteKey = (countryCode, mobile, value) =>{
        const key = countryCode+'#'+mobile
        const LogDate = new Date()
        if(this.checkKey(countryCode, mobile, value)){
            this.keyTable[key] = null
            console.log(`\x1b[96m${LogDate.getFullYear()}.${LogDate.getMonth()+1}.${LogDate.getDate()} ${LogDate.getHours()}:${LogDate.getMinutes()}:${LogDate.getSeconds()}\x1b[0m [Naver Cloud] Delete Key: ${countryCode}:${mobile}`)
        }
    }

}