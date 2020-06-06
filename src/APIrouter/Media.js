const router = require('express').Router()
const jwt = require('../Crypto/jwt')
const db = new (require('../Database/resource'))('localhost', 2424, 'Media')
const multiparty = require('multiparty')
const fs = require('fs')

const basicRouter = async (req, res)=>{
    const result = await db.matchAlbumByMusic(1)
    //const result = await db.matchMusicByAlbum(1)
    return res.json(result)
}
const getTheme = async (req, res)=>{
    console.log('[Media] Theme list')
    // TODO: not all group
    const _groupList = await db.getGroup(null, 2)
    const groupList = _groupList.success ? _groupList.data : []
    const _albumList = await db.getGroup(null, 3)
    const albumList = _albumList.success ? _albumList.data : []
    const resultList = {}
    await albumList.map(item=>{
        const payload = {ID:item.ID, title: item.title, artist:item.artist, uri:item.uri}
        if(!resultList[item.LID])
            resultList[item.LID] = {}
        if(!resultList[item.LID].list)
            resultList[item.LID].list = [payload]
        else
            resultList[item.LID].list = [...resultList[item.LID].list, payload]
    })
    const completeList = await groupList.map(item =>{
        const {ID, title, subTitle} = item
        if(!resultList[ID] || !resultList[ID].list)
            return {ID, title, subTitle, list:[]}
        return {ID, title, subTitle, list:resultList[ID].list}
    })
    res.json({
        success:true,
        result: completeList
    })
}

const getCategory = async (req, res)=>{
    const {type, id} = req.query
    let dbResponse;
    let payload;
    switch(type){
        case 'high':
            dbResponse = await db.getGroup(null, 0);
            payload = dbResponse.data.map(item=>(
                { ID:item.ID, title:item.title, info:item.info }))
            break
        case 'middle':
            dbResponse = await db.getGroup(id, 1);
            payload = dbResponse.data.map(item=>(
                { ID:item.ID, HID:item.HID, title:item.title, info:item.info }));
            break;
        case 'low':
            dbResponse = await db.getGroup(id, 2);
            payload = dbResponse.data.map(item=>(
                { ID:item.ID, MID:item.MID, title:item.title, subTitle:item.subTitle, designType:item.designType}));
            break;
        case 'album':
            dbResponse = await db.getGroup(id, 3);
            payload = dbResponse.data.map(item=>(
                { ID:item.ID, LID:item.LID, title:item.title, artist:item.artist, uri:item.uri, info:item.info}));
            break;
        default:
            return res.json({success:false})
    }
    res.json({success:dbResponse.success, data:payload})

}
const getMusic = async (req,res)=>{
    const {album, title, uri, songCreator, lyricCreator, author, publisher} = req.query
    let dbResponse = {success:false}

    switch(false){
        case !album:
            dbResponse = await db.matchMusicByAlbum(album); break;
        case !title:
            dbResponse = await db.searchMusic('title', title); break
        case !uri:
            dbResponse = await db.searchMusic('uri', uri); break
        case !songCreator:
            dbResponse = await db.searchMusic('songCreator', songCreator); break
        case !lyricCreator:
            dbResponse = await db.searchMusic('lyricCreator', lyricCreator); break
        case !author:
            dbResponse = await db.searchMusic('author', author); break
        case !publisher:
            dbResponse = await db.searchMusic('publisher', publisher); break
        default:
            dbResponse = await db.queryMusic()
    }

    const data = dbResponse.success ? dbResponse.data.map((
        {MID, title, uri, category, songCreator, lyricCreator, author, publisher, info}) => ({
        MID, title, uri, category, songCreator, lyricCreator, author, publisher, info })) : []

    return res.json({success:dbResponse.success, data})
}

const registerMusic = async (req,res)=>{
    const form = new multiparty.Form();
    const payload = {title:'', songCreator:'', lyricCreator:'', author:'', publisher:'', info:'', albumList:'', uri:'', category:''} 

    // Get values from each form field
    form.on('field',(name,value)=>
        payload[name] === '' && typeof value==='string' ? payload[name]=value : null
    )
    
    form.on('part',(part)=>{
        const uri = part.filename.replace(/ /gi,"").replace(".mp3","")
        const filename = uri+'.mp3'
        filename ? part.resume() : null
        payload.uri = uri
        console.log("[Media] Write Music file :" + filename);

        const writeStream = fs.createWriteStream('./resource/_music/'+filename);
        writeStream.filename = filename
        part.pipe(writeStream);

        part.on('end',function(){
            console.log(filename+' Part read complete');
            writeStream.end();
        });

    });

    // all uploads are completed
    form.on('close',async()=>{
        const dbResult = await db.registerMusic(payload)
        const albumList = JSON.parse(payload.albumList).data
        albumList.map(async(_item)=>{
            const item = typeof _item === 'string' ? parseInt(_item) : _item
            await db.connectMusicToAlbum(dbResult.data.MID, item)
        })
        res.status(200).redirect('/')
    });

    // track progress
    form.on('progress',(byteRead,byteExpected)=>{
        //console.log(' Reading total  '+byteRead+'/'+byteExpected);
    });

    form.parse(req);
 
}

const registerCategory = async(req, res)=>{
    const {group, upperID} = req.body
    const result = await db.registerCategory(group, upperID)
    res.json(result)
}
const updateCategory = async (req, res)=>{
    const {ID, group} = req.body
    const categoryProperty = ['title', 'designType', 'subTitle', 'artist', 'info']
    let payload = {}
    categoryProperty.map(item=>
        req.body[item] && req.body[item] !== '' ? payload[item] = req.body[item] : null
    )
    console.log(ID, group)
    console.log(payload)
    res.json({success:true})
}


router.get('/', basicRouter)
//router.get('/album', getMusicByAlbum)

router.post('/category',registerCategory)
router.get('/category', getCategory)
router.put('/category', updateCategory)
router.get('/theme', getTheme)
router.get('/music', getMusic)
router.post('/music',registerMusic)
module.exports = router