const path = require('path'); 
require('dotenv').config({ path: path.join(__dirname, '.env') });
var express = require('express');
var bodyParser = require('body-parser')
const musicstoreRouter = require('./Routers/musicstore')
const authenticateRouter = require('./Routers/user')
const accessRouter = require('./Routers/access')

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(__dirname))
app.use('/', musicstoreRouter);
app.use('/', authenticateRouter);
app.use('/', accessRouter);

var server = app.listen(3000, ()=>{
    console.log('running on: ', server.address().port)
})
