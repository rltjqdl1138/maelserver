const db = require('./index')
const GROUP = ['HighGroup', 'MiddleGroup', 'LowGroup', 'Album']
const UPPERID = ['','HID','MID','LID']
class ResourceDB extends db{
    constructor(host, port, usage){
        super(host, port, usage)
    }
    // Category
    getGroup = async (id, group, type)=>{
        const {dbSession} = this
        if( group===undefined || typeof group !== 'number' || group < 0 || group > 3)
            return {success:false}
        try{
            switch(typeof id){
                case 'string':
                    return { success:true, data: (await dbSession.query(`Select * from ${GROUP[group]} where ${UPPERID[group]}=:ID`,{params:{ID:parseInt(id)}}).all()) }
                
                case 'number':
                    return { success:true, data:await dbSession.query(`Select * from ${GROUP[group]} where ${UPPERID[group]}=:ID`,{params:{ID:id}}).all() }
                
                default:
                    if(type==='1')
                        return { success:true, data:await dbSession.query(`Select * from ${GROUP[group]} where theme>0`).all() }
                    else if(type === '2')
                        return { success:true, data:await dbSession.query(`Select * from ${GROUP[group]} where theme=0`).all() }
                    
                    return { success:true, data:await dbSession.query(`Select * from ${GROUP[group]}`).all() }
            }
        }catch(e){
            console.log(e)
            return {success:false}
        }
    }
    searchMusic = async ( _property, _keyword )=>{
        try{
            const property = typeof _property === 'string' ? _property : 'ANY()'
            const keyword = '%'+_keyword+'%'
            const response = await this.dbSession.query(`select * from Music where ${property} LIKE '${keyword}'`).all()
            return {success:true, data:response}
        }catch(e){
            return {success:false}
        }
    }
    queryMusic = async ( payload )=>{
        try{
            const checklist = ['MID','title','uri','songCreator','lyricCreator','author','publisher']
            let query;
            switch(typeof payload){
                case 'object':
                    query = 'Select * from Music where';
                    checklist.map(item =>{ query = query + (payload[item] ? ` ${item}=:${item},` : '') } )
                    break
                default:
                    query = 'Select * from Music '
            }
            return {success:true, data:await this.dbSession.query(query.slice(0,query.length-1),{params:payload}).all()}
        }catch(e){
            return {success:false}
        }
    }
    matchMusicByAlbum = async (id)=>{
        typeof id === 'number'
        try{
            const response = await this.dbSession.query(`MATCH {class: Album, as: album, where: (ID = '${id}')}.out('E') {as: music} RETURN music`).all()
            if(response.length === 0)
                return {success:true, data:[]}
            let query = 'Select * from Music where '
            response.map(({music}) => query = query + '@rid=#'+music.cluster+':'+music.position+ ' or')
            const result = await this.dbSession.query(query.slice(0,query.length-3)).all()
            return {success:true, data:result}
        }catch(e){
            return {success: false}
        }
    }
    matchAlbumByMusic = async (id)=>{
        try{
            const response = await this.dbSession.query(`MATCH {class: Music, as: music, where: (MID = '${id}')}.in('E') {as: album} RETURN album`).all()
            if(response.length === 0)
                return {success:true, data:[]}
            let query = 'Select * from Album where '
            response.map(({album}) => query = query + '@rid=#'+album.cluster+':'+album.position+ ' or')
            const result = await this.dbSession.query(query.slice(0,query.length-3)).all()

            return {success:true, data:result}
        }catch(e){
            return {success: false, data:[]}
        }
    }

    // Sound Data

    //Get an Album By its ID
    getAlbumByID = async(id)=>{
        const {dbSession} = this
        let album = null
        
        switch(typeof id){
            case 'number':
                album = await dbSession.query('Select * from Album where ID=:ID',{params:{ID:id}}).all(); break;
            case 'string':
                album = await dbSession.query('Select * from Album where ID=:ID',{params:{ID:id}}).all(); break;
            default:
                album = await dbSession.query('Select * from Album').all()
        }
        return {success:true, data:album}
    }
    
    //Get a Music By its ID
    getMusicByID = async(MID)=>{
        const {dbSession} = this
        const music = await dbSession.query('Select * from Music where MID=:MID',{params:{MID}}).all()
        return {success:true, data:music}
    }

    //Get all Musics
    getAllMusic = async()=>{
        const {dbSession} = this
        const music = await dbSession.query('Select * from Music').all()
        return {success:true, data:music}
    }
    moveTheme = async (ID, _theme)=>{
        const {dbSession} = this
        try{
            const theme = _theme ? _theme : (await dbSession.query('select * from LowGroup where theme > 0').all()).length+1
            await dbSession.command(`update LowGroup set theme=:theme where ID=:ID`, {params:{ID, theme}}).all()
            return {success:true}
        }catch(e){
            return {success:false}
        }
    }
    updateCategory = async (ID, _group, payload)=>{
        const {dbSession} = this
        const group = _group && typeof _group === 'string' ? parseInt(_group) : _group
        let result;
        switch(group){
            case 0:
                result = dbSession.command(`update HighGroup set title=:title, info=:info where ID=:ID`,{params:{ID, ...payload}}).all(); break;
            case 1:
                result = dbSession.command(`update MiddleGroup set title=:title, info=:info where ID=:ID`,{params:{ID, ...payload}}).all(); break;
            case 2:
                result = dbSession.command(`update LowGroup set title=:title, subTitle=:subTitle, designType=:designType, theme=:theme where ID=:ID`,{params:{ID, ...payload}}).all(); break;
            case 3:
                result = dbSession.command(`update Album set title=:title, artist=:artist, info=:info, uri=:uri where ID=:ID`,{params:{ID, ...payload}}).all(); break;
            default:
                return {success:false}
        }
        return {success:true, data: result}
    }

    deleteCategory = async (_ID, _group)=>{
        const {dbSession} = this
        if(!_ID || _ID === "") return {success:false}
        const group = _group && typeof _group === 'string' ? parseInt(_group) : _group
        const ID = _ID && typeof _ID === 'string' ? parseInt(_ID) : _ID
        switch(group){
            case 0:
            case 1:
            case 2:
                return {success:true, data: await dbSession.command(`Delete from ${GROUP[group]} where ID=:ID`, {params:{ID}}).all() }
            case 3:
                return {success:true, data: await dbSession.command(`Delete Vertex from Album where ID=:ID`, {params:{ID}}).all() }
            default:
                return {success:false}
        }
    }

    registerCategory = async(_group, _upperID) =>{
        const upperID = _upperID && typeof _upperID === 'string' ? parseInt(_upperID) : _upperID
        const group = _group && typeof _group === 'string' ? parseInt(_group) : _group
        let query = ''
        switch(group){
            case 0:
                query = `insert into HighGroup set ID=sequence('hgIDseq').next(), title='New Category'`
                break;
            case 1:
                query = `insert into MiddleGroup set ID=sequence('mdIDseq').next(), HID=${upperID}, title='New Category'`
                break;
            case 2:
                query = `insert into LowGroup set ID=sequence('loIDseq').next(), MID=${upperID}, title='New Category', designType=0, theme=0`
                break;
            case 3:
                query = `create Vertex Album set ID=sequence('AlbumIDseq').next(), LID=${upperID}, title='New Album', artist='Mael'`
                break;
            default:
                return {success:false}
        }
        const result = await this.dbSession.command(query).all()
        return {success:true, data:result}
    }
    updateMusic = async(payload)=>{
        const {dbSession} = this
        const {MID, title, category} = payload
        if(!MID || !title || !category)
            return {success:false}

        const nowTime = Date.now()
        const query = `Update Music set title=:title, category=:category, info=:info, songCreator=:songCreator, lyricCreator=:lyricCreator, author=:author, publisher=:publisher, updatedTime=:updatedTime where MID=:MID`
        const result = await dbSession.command(query,{params:{...payload, updatedTime:nowTime}}).all()
        return {success:true, data:result}
    }
    registerMusic = async(payload)=>{
        const {dbSession} = this
        const nowTime = Date.now()
        const {title, uri, category} = payload
        if(!title || !uri || !category)
            return {success:false}
        const query = `Create Vertex Music set MID=sequence('MusicIDseq').next(), title=:title, uri=:uri, category=:category, info=:info, songCreator=:songCreator, lyricCreator=:lyricCreator, author=:author, publisher=:publisher, createdTime=:createdTime, updatedTime=:updatedTime`
        const result = await dbSession.command(query,{params:{...payload, createdTime:nowTime, updatedTime:nowTime}}).one()
        return {success:true, data:result}
    }
    connectMusicToAlbum = async(MID, albumID)=>{
        console.log(`[Category] Connect ${MID} to ${albumID}`)
        if(typeof MID !== 'number' || typeof albumID !== 'number')
            return {success:false}
        const query = `Create Edge From (Select From Album where ID=${albumID}) TO (Select From Music where MID=${MID})`
        const result = await this.dbSession.command(query).all()
        return {success:true, data:result}
    }
    disconnectMusicToAlbum = async (MID, albumID)=>{
        console.log(`[Category] Disconnect ${MID} to ${albumID}`)
        if(typeof MID !== 'number' || typeof albumID !== 'number')
            return {success:false}
        const query = `Delete EDGE from (Select from Album where ID=${albumID}) to (Select from Music where MID=${MID})`
        const result = await this.dbSession.command(query).all()
        return {success:true, data:result}
    }
    
}


module.exports = ResourceDB

