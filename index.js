#!/usr/bin/env nodemon
const express = require('express');
const https = require('https');
const http = require('http');
const bodyParser = require('body-parser')
const fs = require('fs');

// Create Express app
const app = express();
const mainapp = require('./src/index')

// Express Modules
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use('/', mainapp)


try{
    //Load SSL Authentication Files
    const passphrase = 'kks141592Az!'
    const options = { 
        ca: fs.readFileSync('./security/ssl/ca_bundle.crt'), 
        pfx:  fs.readFileSync('./security/ssl/cert.pfx'), 
        passphrase
    };

    // Create an HTTPS service.
    https.createServer(options, app).listen(4001, ()=>
        console.log('Mael https Streaming Server on port \x1b[97m4001\x1b[0m')
    );
    // Create an HTTP service.
    http.createServer(app).listen(4000,()=>
        console.log('Mael http Streaming Server on port \x1b[97m4000\x1b[0m')
    );

}catch(e){
    // Create an HTTP service.
    http.createServer(app).listen(4000,()=>
        console.log('Mael Streaming Server on port \x1b[97m4000\x1b[31m without SSL Authentication\x1b[0m')
    );
}