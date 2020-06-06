const db = require('./index')
const GROUP = ['HighGroup', 'MiddleGroup', 'LowGroup', 'Album']
const UPPERID = ['','HID','MID','LID']
class ResourceDB extends db{
    constructor(host, port, usage){
        super(host, port, usage)
    }
    // Category
    getGroup = async (id, group)=>{
        const {dbSession} = this
        console.log(id, group)
        if( group===undefined || typeof group !== 'number' || group < 0 || group > 3)
            return {success:false}
        try{
            switch(typeof id){
                case 'string':
                    return { success:true, data:await dbSession.query(`Select * from ${GROUP[group]} where ${UPPERID[group]}=:ID`,{params:{ID:parseInt(id)}}).all() }
                case 'number':
                    return { success:true, data:await dbSession.query(`Select * from ${GROUP[group]} where ${UPPERID[group]}=:ID`,{params:{ID:id}}).all() }
                default:
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
            const IDS = response.map(({music}) => '#'+music.cluster+':'+music.position )
            const result = await this.dbSession.query(`Select from Music [${String(IDS)}]`).all()
            return {success:true, data:result}
        }catch(e){
            return {success: false}
        }
    }
    matchAlbumByMusic = async (id)=>{
        typeof id === 'number'
        try{
            const response = await this.dbSession.query(`MATCH {class: Music, as: music, where: (MID = '${id}')}.in('E') {as: album} RETURN album`).all()
            const IDS = response.map(({album}) => '#'+album.cluster+':'+album.position )
            const result = await this.dbSession.query(`Select from Album [${String(IDS)}]`).all()
            return {success:true, data:result}
        }catch(e){
            return {success: false}
        }
    }

    // Sound Data
    getAlbumGroupList = async(id)=>{
        const {dbSession} = this
        let albumGroup = null
        switch(typeof id){
            case 'list':
                break;
            case 'string':
                albumGroup = await dbSession.query('Select * from AlbumGroup where ID=:ID', {params:{ID:id}}).all()
                break;
            default:
                albumGroup = await dbSession.query('Select * from AlbumGroup').all()
                break;
        }
        return {success:true, data:albumGroup}
    }

    getAlbumTitle = async(id)=>{
        const {dbSession} = this
        let albumTitle = null
        switch(typeof id){
            case 'list':
                break;
            case 'string':
                albumTitle = await dbSession.query('Select * from Album where ID=ID',{params:{ID:id}}).all()
            default:
                albumTitle = await dbSession.query('Select * from Album').all()
        }
        return {success:true, data:albumTitle}
    }

    getMusicListByAlbumID = async(album)=>{
        const {dbSession} = this
        const musics = await dbSession.query('Select * from Music where albumID=:albumID',{params:{albumID:album}}).all()
        return {success:true, data:musics}
    }
    
    getMusicByID = async(MID)=>{
        const {dbSession} = this
        const music = await dbSession.query('Select * from Music where MID=:MID',{params:{MID}}).one()
        return {success:true, data:music}
    }

    getAllMusic = async()=>{
        const {dbSession} = this
        const music = await dbSession.query('Select * from Music').all()
        return {success:true, data:music}
    }
    updateCategory = async (ID, _group, payload)=>{
        const {dbSession} = this
        const group = _group && typeof _group === 'string' ? parseInt(_group) : _group
        let result;
        switch(group){
            case 0:
                result = dbSession.command(`update HighGroup set title=:title, info=:info where ID=:ID`,{params:{ID, ...paylaod}}).all(); break;
            case 1:
                result = dbSession.command(`update MiddleGroup set title=:title, info=:info where ID=:ID`,{params:{ID, ...paylaod}}).all(); break;
            case 2:
                result = dbSession.command(`update LowGroup set title=:title, subTitle=:subTitle, designType=:designType where ID=:ID`,{params:{ID, ...paylaod}}).all(); break;
            case 3:
                result = dbSession.command(`update Album set title=:title, artist=:artist, info=:info where ID=:ID`,{params:{ID, ...paylaod}}).all(); break;
            default:
                return {success:false}
        }
        return {success:true, data: result}

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
                query = `insert into LowGroup set ID=sequence('loIDseq').next(), MID=${upperID}, title='New Category', designType=0`
                break;
            case 3:
                query = `create Vertex Album set ID=sequence('AlbumIDseq').next(), LID=${upperID}, title='New Album', artist='Mael'`
                break;
            default:
                return {success:false}
        }
        const result = await this.dbSession.command(query).all()
        return {result:true, data:result}

    }

    registerMusic = async(payload)=>{
        const {dbSession} = this
        const {title, uri, category} = payload
        if(!title || !uri || !category)
            return {success:false}
        const query = `Create Vertex Music set MID=sequence('MusicIDseq').next(), title=:title, uri=:uri, category=:category, info=:info, songCreator=:songCreator, lyricCreator=:lyricCreator, author=:author, publisher=:publisher`
        const result = await dbSession.command(query,{params:payload}).one()
        return {success:true, data:result}
    }
    //Image Data
    connectMusicToAlbum = async(MID, albumID)=>{
        if(typeof MID !== 'number' || typeof albumID !== 'number')
            return {success:false}
        const query = `Create Edge From (Select From Album where ID=${albumID}) TO (Select From Music where MID=${MID})`
        const result = await this.dbSession.command(query).all()
        return {success:true, data:result}
    }
}


module.exports = ResourceDB

