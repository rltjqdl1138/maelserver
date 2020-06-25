const router = require('express').Router()
const jwt = require('../Crypto/jwt')
const db = new (require('../Database/resource'))('localhost', 2424, 'Media')
const multiparty = require('multiparty')
const fs = require('fs')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

const __Resource = __dirname+'/../../resource'

const basicRouter = async (req, res)=>{
    console.log('basic')
    return res.json({success:true})
}
const getTheme = async (req, res)=>{
    const {type} = req.query
    console.log('[Media] Theme list')
    // TODO: not all group
    const _groupList = await db.getGroup(null, 2, type)
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
        const {ID, title, subTitle, designType} = item
        if(!resultList[ID] || !resultList[ID].list)
            return {ID, title, subTitle, designType, list:[]}
        return {ID, title, subTitle, designType, list:resultList[ID].list}
    })

    res.json({
        success:true,
        result: completeList
    })
}

const updateTheme = async (req, res)=>{
    const {id, theme} = req.body
    console.log(id, theme)
    await db.moveTheme(id, theme)
    res.json({success:true})
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

const getAlbums = async (req, res)=>{
    const {mid, id} = req.query
    if(!mid && !id) return res.json({success:false})
    const dbResponse = mid ? await db.matchAlbumByMusic(mid) : await db.getAlbumByID(id)
    res.json(dbResponse)
}
const getMusic = async (req,res)=>{
    const {id, album, title, uri, songCreator, lyricCreator, author, publisher} = req.query
    let dbResponse = {success:false}

    switch(false){
        case !id:
            dbResponse = await db.getMusicByID(id); break;
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
    const data = dbResponse.success && dbResponse.data.length > 0 ? dbResponse.data.map((
        {MID, title, uri, category, songCreator, lyricCreator, author, publisher, info}) => ({
        MID, title, uri, category, songCreator, lyricCreator, author, publisher, info })) : []

    return res.json({success:dbResponse.success, data})
}
const updateMusic = async (req, res)=>{
    const form = new multiparty.Form();
    const payload = {MID:'', title:'', songCreator:'', lyricCreator:'', author:'', publisher:'', info:'', albumList:'', category:''} 

    // Get values from each form field
    form.on('field', (name,value)=>
        payload[name] === '' && typeof value==='string' ? payload[name]=value : null
    )
    
    form.on('part',(part)=>{
        const uri = part.filename.replace(/ /gi,"").replace(".mp3","")
        if(!uri || uri===''){
            part.resume()
            return;
        }
        const filename = uri+'.mp3'
        console.log("[Media] Write Music file :" + filename);
        payload.uri = uri

        const writeStream = fs.createWriteStream('./resource/music/'+filename);
        writeStream.filename = filename
        part.pipe(writeStream);

        part.on('end',()=>{
            console.log(filename+' Part read complete');
            writeStream.end();
        });
    });

    // all uploads are completed
    form.on('close',async()=>{
        const dbResult = await db.updateMusic(payload)
        if(!dbResult.success)
            res.status(404).redirect('/')
        const oldAlbumList = (await db.matchAlbumByMusic(payload.MID)).data.map(item=>item.ID)
        const newAlbumList = JSON.parse(payload.albumList).data

        oldAlbumList.map( async(item)=>{
            const a = newAlbumList.find(e => e===item)
            if(!a) await db.disconnectMusicToAlbum(parseInt(payload.MID), item)
        })

        newAlbumList.map( async(item)=>{
            const a = oldAlbumList.find(e => e===item)
            if(!a) await db.connectMusicToAlbum(parseInt(payload.MID), item)
        })

        res.status(200).redirect('/')
    });

    // track progress
    form.on('progress',(byteRead,byteExpected)=>{
        //console.log(' Reading total  '+byteRead+'/'+byteExpected);
    });

    form.parse(req);
}

const registerMusic = async (req,res)=>{
    const form = new multiparty.Form();
    const payload = {title:'', songCreator:'', lyricCreator:'', author:'', publisher:'', info:'', albumList:'', uri:'', category:''} 
    let filename = '';
    // Get values from each form field
    form.on('field',(name,value) => payload[name] === '' && typeof value==='string' ? payload[name]=value : null)
    
    form.on('part',(part)=>{
        const uri = part.filename.replace(/ /gi,"").replace(".mp3","")
        uri ? part.resume() : null
        filename = uri+'.mp3'
        payload.uri = uri

        const writeStream = fs.createWriteStream(__Resource+'/music/'+filename);
        writeStream.filename = filename
        part.pipe(writeStream);

        part.on('end',function(){
            console.log(`[Music File] ${filename} is uploaded`);
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
        trimMusic(filename)
    });

    // track progress
    form.on('progress',(byteRead,byteExpected)=>{
        //console.log(' Reading total  '+byteRead+'/'+byteExpected);
    });

    form.parse(req);
}

const trimMusic = (filename)=>{
    ffmpeg(__Resource+'/music/'+filename)
        .inputOptions('-t 30')
        .output(__Resource+'/sample/'+filename)
        .on('end', ()=> console.log(`[Music File] ${filename}'s Sample is created`))
        .on('error',(e)=> console.log(`[Error] ${filename}'s Sample is not Created`))
        .run()
}

const registerCategory = async(req, res)=>{
    const {group, upperID} = req.body
    console.log(`[Media] Register Category: ${group} from ${upperID}`)
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
    const dbResponse = await db.updateCategory(ID, group, payload)
    res.json(dbResponse)
}
const deleteCategory = async (req, res)=>{
    const {id, group} = req.query
    console.log(`[Media] Delete Category: ${id} in ${group}`)
    const dbResult = await db.deleteCategory(id, group)
    res.json(dbResult)
}


router.get('/', basicRouter)
//router.get('/album', getMusicByAlbum)

router.post('/category',registerCategory)
router.get('/category', getCategory)
router.put('/category', updateCategory)
router.delete('/category', deleteCategory)

router.get('/theme', getTheme)
router.put('/theme', updateTheme)

router.get('/music', getMusic)
router.post('/music',registerMusic)
router.post('/music/update',updateMusic)

router.get('/album',getAlbums)
module.exports = router