const { ListBucketsCommand } = require("@aws-sdk/client-s3");
const { ListObjectsCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require("./s3Client.js");
const {pool}  = require("./database.js");
const {uploadFile} = require('./uploadfile.js');
require('dotenv').config()

var bodyParser = require('body-parser')

function listBucket(){
    const run = async () =>{
        try{
            const data = await s3Client.send(new ListBucketsCommand({}));
            console.log("Success", data.Buckets);
        }catch(err) {
            console.log("error");
        }
    };
    run();
}


function uploadSongDetails(Id ,title, artist, genre, yearofrelease, imgLink, s3Link){
    imgDest = "coverImg/" + imgLink;
    s3Dest = "music/" + s3Link;
    var query = "INSERT INTO `song` (title, artist, genre, yearout, coverimg, s3link )"
    var values = " VALUES(\"" + title + "\", \"" +  artist + "\", \"" + genre + "\", " +  yearofrelease + ", \"" + imgDest +"\", \"" + s3Dest +"\");"
    var finalquery = query + values;
    
    pool.getConnection( function(error, connection) {
        if(error){
            throw error;
        }else{
            connection.query(finalquery , function (err, result, fields) {
                if (err) throw err;
                console.log("ok check your databse");
                connection.release();
            })
        }
    });
}


function uploadHandler(file, img, fileData, filename, imgName){
    uploadFile(file, img, filename, imgName);
    uploadSongDetails(fileData.id ,fileData.title, fileData.artist, fileData.genre, fileData.year, imgName, filename );
}

function validInput(input){
    if(input != undefined && input != ''){
        return true;
    }
    return false;
}

const multer = require('multer');
const upload = multer({dest: 'uploads/'})


var express = require('express');

var app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

app.use(express.static(__dirname))

const multerupload =  upload.fields([{name: "music", maxCount: 1}, {name: "cover", maxCount: 1}]);

app.post('/upload', (req, res) => {
    multerupload(req, res, function(error){
        if(error instanceof multer.MulterError){
            console.log("okayasdadsadsa")
            res.status(404).send('Sorry, something wrong');
        }else{
            const file = req.files['music'][0];
            const img = req.files['cover'][0];
            const fileName = file.originalname;
            const imgName = img.originalname;
            const fileData = req.body;
            console.log(fileName);
            console.log(imgName);
            uploadHandler(file, img, fileData, fileName, imgName);
            res.send("ok")
        }
    })
})

app.get('/song/queryall/:pagesize/:pagenum', (req, res) =>{
    var input =req.query.input;
    var isnum = /^\d+$/.test(input);

    var pagesize = req.params.pagesize;
    var pagenum = req.params.pagenum -1;

    if(pagesize < 0 || pagenum < 0){
        res.status(404).send("Not found, wrong pagesize or pagenum");
        return
    }

    if(Object.keys(req.query).length == 0){
        res.status(400).send("Missing queries");
        return
    }

    var query = "SELECT * FROM `song` WHERE title like '%"+ input +"%' or artist like '%"+ input +"%' or genre like '%"+ input +"%'";
    var pagination = "LIMIT " + pagesize + " OFFSET " + pagenum * pagesize;
    if(isnum){
        var queryAdd =  query + "or yearout = " + input + " " + pagination;

        pool.getConnection(function(err, conn){
            if(err){
                res.status(400).send("can't connect to the database")
                return
            }
            conn.query(queryAdd, function(err, rows) {
                if(err){
                    res.send(err["sqlMessage"])
                    return
                }
                 res.send(rows);
                 conn.release();
            })
        })

    }else{
        var queryAdd = query + pagination;

        pool.getConnection(function(err, conn){
            if(err){
                res.status(400).send("can't connect to the database")
                return
            }
            conn.query(queryAdd, function(err, rows) {
                if(err){
                    res.send(err["sqlMessage"])
                    return
                }
                 res.send(rows);
                 conn.release();
            })
        })

    }
})

app.get('/song/queries/:pagesize/:pagenum', (req, res) =>{
    let title = req.query.title;
    var artist = req.query.artist;
    var genre = req.query.genre;
    var year = req.query.year;

    var pagesize = req.params.pagesize;
    var pagenum = req.params.pagenum -1;

    if(pagesize < 0 || pagenum < 0){
        res.status(404).send("Not found, wrong pagesize or pagenum");
        return
    }

    if(Object.keys(req.query).length == 0){
        res.status(400).send("Missing queries")
        return
    }

    var pagination = "LIMIT " + pagesize + " OFFSET " + pagenum * pagesize;

    var hasQueries = false;
    var conditions = '';
    if(title != undefined && artist != ''){
        conditions += "title like '%"+ title +"%'";
        hasQueries = true;
    }
    if(artist != undefined && artist != ''){
        if(hasQueries){
            conditions += "and ";
        }
        conditions += "artist like '%"+ artist +"%'";
        hasQueries = true;
    }
    if(genre != undefined && genre != ''){
        if(hasQueries){
            conditions += "and ";
        }
        conditions += "genre like '%"+ genre +"%'";
        hasQueries = true;
    }
    if(year != undefined && year != ''){
        if(hasQueries){
            conditions += "and ";
        }
        conditions += "yearout = " + year;
    }

    var query = "SELECT * FROM `song`"
    if(conditions != ''){
        query += " WHERE " + conditions + " "+ pagination;

            pool.getConnection(function(err, conn){
                if(err){
                    res.status(400).send("can't connect to the database")
                    return
                }
                conn.query(query, function(err, rows) {
                    if(err){
                        res.send(err["sqlMessage"])
                        return
                    }
                     res.send(rows);
                     conn.release();
                })
            })
            
        return
    }else{
        res.status(400).send("wrong query")
        return
    }
})

app.put("/song/updatelike", (req, res) =>{
    var id = req.query.song_id;

    if(Object.keys(req.query).length == 0){
        res.status(400).send("Missing queries");
        return
    }

    var getLikeQuery = "SELECT song_like FROM `song` WHERE id = ?"
    pool.getConnection(function(err, conn){
        if(err){
            res.status(400).send("can't connect to the database")
            return
        }
        conn.query(getLikeQuery,[id] , function(err, like) {
            if(err){
                res.status(400).send(err["sqlMessage"]);
                return;
            }
            
            var query = "UPDATE `song` SET song_like = ? WHERE id = ?";
            conn.query(query,[like[0].song_like +1, id] , function(err, result) {
                if(err){
                    res.status(400).send(err["sqlMessage"]);
                    return;
                }
            })

            res.send("ok");
            conn.release();
        })
    })
})

app.put("/song/updateview", (req, res) =>{
    var id = req.query.song_id;

    if(Object.keys(req.query).length == 0){
        res.status(400).send("Missing queries");
        return
    }

    var getLikeQuery = "SELECT song_view FROM `song` WHERE id = ?"
    pool.getConnection(function(err, conn){
        if(err){
            res.status(400).send("can't connect to the database")
            return
        }
        conn.query(getLikeQuery,[id] , function(err, view) {
            if(err){
                res.status(400).send(err["sqlMessage"]);
                return;
            }
            var query = "UPDATE `song` SET song_view = ? WHERE id = ?";
            conn.query(query,[view[0].song_view +1, id] , function(err, result) {
                if(err){
                    res.status(400).send(err["sqlMessage"]);
                    return;
                }
            })
            res.send("ok");
            conn.release();
        })
    })

})

//Create playlist
app.post("/playlist", (req, res) =>{
    var query = "INSERT INTO `playlist_owner` SET ?";
    var data = req.body;

    pool.getConnection(function(err, conn){
        if(err){
            res.status(400).send("can't connect to the database")
            return
        }
        conn.query(query,[data] , function(err, rows) {
            if(err){
                res.status(400).send(err["sqlMessage"]);
                return;
            }
            res.send("ok");
            conn.release();
        })
    })
})

// Update Playlist
app.put("/playlist", (req, res) => {
    var data = req.body;
    var user_id = req.query.user_id;
    var playlist_id = req.query.playlist_id;
    var query = "UPDATE `playlist_owner` SET ? WHERE id = ? and user_id = ?"

    pool.getConnection(function(err, conn){
        if(err){
            res.status(400).send("can't connect to the database")
            return
        }
        conn.query(query, [data,playlist_id, user_id] , function(err, rows) {
            if(err){
                res.status(400).send(err["sqlMessage"]);
                return
            }
            res.send("ok")
            conn.release();
        })
    })
})

// Delete playlist
app.delete("/playlist", (req, res) =>{
    var id = req.query.playlist_id;
    var user_id = req.query.user_id;
    var query = "DELETE FROM `playlist_owner` WHERE id = " + id + " and user_id = " + user_id;
    pool.getConnection(function(err, conn){
        if(err){
            res.status(400).send("can't connect to the database")
            return
        }
        conn.query(query , function(err, rows) {
            if(err){
                res.send(err["sqlMessage"])
                return
            }
            res.send("ok")
            conn.release();
        })
    })
})


// list playlist and list song from playlist
app.get("/playlist/:method/:userid", (req, res) =>{
    //get user id from user email?
    var id = req.params.userid;
    var method = req.params.method;
    var playlistid = req.query.playlist_id;

    query = '';
    searchUser = "SELECT id FROM `user` WHERE id = " + id;
    if(method == "list"){
        listPlaylist = "SELECT * FROM `playlist_owner` WHERE user_id = (" + searchUser + ")";
        query = listPlaylist;
    }else if(method == "listsong"){
        if(!validInput(playlistid)){
            res.send('invalid id')
            return
        }
        getPlaylistId = "SELECT id FROM `playlist_owner` WHERE id = "+ playlistid +" and user_id = (" + searchUser + ")";
        listPlaylistSong = "SELECT song_id FROM `playlist_song` WHERE playlist_owner_id = (" + getPlaylistId + ")";
        getSongDetails = "SELECT * FROM `song` WHERE id IN (" + listPlaylistSong + ")";
        query = getSongDetails;
    }

    pool.getConnection(function(err, conn){
        if(err){
            res.status(400).send("can't connect to the database")
            return
        }
        conn.query(query, function(err, rows) {
            if(err){
                res.status(400).send(err["sqlMessage"])
                return
            }
            res.send(rows)
            conn.release();
        })
    })
})

//put song to playlist
app.post("/playlist/song", (req, res) =>{
    var data = req.body;
    var query = "INSERT INTO `playlist_song` SET ?"

    pool.getConnection(function(err, conn){
        if(err){
            res.status(400).send("can't connect to the database")
            return
        }
        conn.query(query,[data] , function(err, rows) {
            if(err){
                res.status(400).send(err["sqlMessage"])
                return
            }
            res.send("ok")
            conn.release();
        })
    })
})

// delete song from playlist
app.delete("/playlist/song", (req, res) => {
    var songId = req.query.song_id;
    var playlistid = req.query.playlist_id
    var query = "DELETE FROM `playlist_song` WHERE song_id = " + songId + " and playlist_owner_id = "+ playlistid;

    pool.getConnection(function(err, conn){
        if(err){
            res.status(400).send("can't connect to the database")
            return
        }
        conn.query(query , function(err, rows) {
            if(err){
                res.status(400).send(err["sqlMessage"])
                return
            }
            res.send("ok")
            conn.release();
        })
    })
})
////
app.post("/confirm", (req, res) => {
    var confirmCode = req.body.confirm_code;
    var username = req.body.username;

    var poolData = {
        UserPoolId: 'ap-southeast-1_PFUux5qaA', // Your user pool id here
        ClientId: '3rfeiefhfq1c0qi0itfe4tdl50', // Your client id here
    };
    
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    var userData = {
        Username: username,
        Pool: userPool,
    };
    
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.confirmRegistration(confirmCode, true, function(err, result) {
        if (err) {
            console.log(err.message || JSON.stringify(err));
            res.status(400).send("Can't not cofirm user")
            return;
        }
        console.log('call result: ' + result);
        res.send("Confirm successfully")
    });

})


var AmazonCognitoIdentity = require('amazon-cognito-identity-js');
////
app.post("/register", (req,res) => {
    var email = req.body.email;
    var phone_number = req.body.phone_number;
    var birthdate = req.body.birthdate;
    var gender = req.body.gender;
    var username = req.body.username;
    var password = req.body.password;

    var poolData = {
        UserPoolId: 'ap-southeast-1_PFUux5qaA', // Your user pool id here
        ClientId: '3rfeiefhfq1c0qi0itfe4tdl50', // Your client id here
    };
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    
    var attributeList = [];
    
    var dataEmail = {
        Name: 'email',
        Value: email,
    };
    
    var dataPhoneNumber = {
        Name: 'phone_number',
        Value: phone_number,
    };
    var dataBirth = {
        Name: 'birthdate',
        Value: birthdate,
    }
    var dataGender = {
        Name: 'gender',
        Value: gender,
    }
    var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);
    var attributePhoneNumber = new AmazonCognitoIdentity.CognitoUserAttribute(
        dataPhoneNumber
    );
    var attributeBirth = new AmazonCognitoIdentity.CognitoUserAttribute(dataBirth);
    var attributeGender = new AmazonCognitoIdentity.CognitoUserAttribute(dataGender);
    
    attributeList.push(attributeEmail);
    attributeList.push(attributePhoneNumber);
    attributeList.push(attributeBirth);
    attributeList.push(attributeGender);

    userPool.signUp(username, password, attributeList, null, function(err,result){
        if (err) {
            res.status(400).send(err.message || JSON.stringify(err))
        }
        var cognitoUser = result.user;
        res.send("Register successfully username: "+cognitoUser.getUsername());
    });
})

var AWS = require("aws-sdk");
app.post("/login", (req, res) => {
    var username = req.body.username;
    var password = req.body.password;

    var authenticationData = {
        Username: username,
        Password: password,
    };
    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(
        authenticationData
    );
    var poolData = {
        UserPoolId: 'ap-southeast-1_PFUux5qaA', // Your user pool id here
        ClientId: '3rfeiefhfq1c0qi0itfe4tdl50', // Your client id here
    };
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    var userData = {
        Username: username,
        Pool: userPool,
    };
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function(result) {
            var accessToken = result.getAccessToken().getJwtToken();
            var refreshToken = result.getRefreshToken();
            var idToken = result.getIdToken().getJwtToken();
            
            AWS.config.region = 'ap-southeast-1';
    
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: 'ap-southeast-1:a1bd5688-cc6b-4067-9f86-dbe564f6709c', // your identity pool id here
                Logins: {
                    'cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_PFUux5qaA': result
                        .getIdToken()
                        .getJwtToken(),
                },
            });
    
            //refreshes credentials using AWS.CognitoIdentity.getCredentialsForIdentity()
            AWS.config.credentials.refresh(error => {
                if (error) {
                    console.error(error);
                } else {
                    var respond = {
                        accessToken: accessToken,
                        idToken: idToken,
                        refreshToken: refreshToken
                    }
                    res.send(respond)
                }
            });
        },
    
        onFailure: function(err) {
            res.status(400).send(err.message || JSON.stringify(err));
        },
    });
})


var jwt = require('jsonwebtoken');
var jwkToPem = require('jwk-to-pem');
const { CognitoIdentityServiceProvider } = require("aws-sdk");

app.post("/verify", (req, res) => {
    var token = req.body.jwk;
    var jwk = JSON.parse(process.env.JWK);
    var pem = jwkToPem(jwk.keys[1]);
    jwt.verify(token, pem,{algorithms: ["RS256"]} , function(err, decoded) {
        if(err){
            console.log(err)
        }
        console.log(decoded)
        res.send("ok")
    })
})

app.post("/refreshtoken", (req, res) =>{
    var refresh_Token = req.body.refresh_token;
    var params = {
        AuthFlow: "REFRESH_TOKEN_AUTH", /* required */
        ClientId: '3rfeiefhfq1c0qi0itfe4tdl50', /* required */
        AuthParameters: {
          'REFRESH_TOKEN': refresh_Token,
        }
      };
      var cognito = new AWS.CognitoIdentityServiceProvider();
      cognito.initiateAuth(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
            console.log(data);
            res.send(data);
        }           // successful response
    });
})
////
app.post("/signout", (req,res) =>{
    var poolData = {
        UserPoolId: 'ap-southeast-1_PFUux5qaA', // Your user pool id here
        ClientId: '3rfeiefhfq1c0qi0itfe4tdl50', // Your client id here
    };
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    
    var userData = {
        Username: req.query.username,
        Pool: userPool,
    };
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    cognitoUser.getSession((err, result) =>{
        if(result){
            cognitoUser.globalSignOut({
                onSuccess: function(result){
                    console.log(result)
                },
                onFailure: function(err){
                    console.log(err)
                },
              });
        }
    })
    res.send("ok")
})

app.get("/getpresignedurl", (req, res) => {
    var token = req.body.jwt;
    var fileName = req.query.filename;
    var jwk = JSON.parse(process.env.JWk);
    var pem = jwkToPem(jwk.keys[1]);
    jwt.verify(token, pem,{algorithms: ["RS256"]} , function(err, decoded) {
        if(err){
            console.log(err)
            res.status(400).send("Invalid Token")
        }
        var poolData = {
            UserPoolId: 'ap-southeast-1_PFUux5qaA', // Your user pool id here
            ClientId: '3rfeiefhfq1c0qi0itfe4tdl50', // Your client id here
        };
        var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
        
        var userData = {
            Username: decoded.username,
            Pool: userPool,
        };
        var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.getSession((err, result) =>{
            if(result){
                AWS.config.region = 'ap-southeast-1';

                AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                    IdentityPoolId: 'ap-southeast-1:a1bd5688-cc6b-4067-9f86-dbe564f6709c', // your identity pool id here
                    Logins: {
                        // Change the key below according to the specific region your user pool is in.
                        'cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_PFUux5qaA': result
                            .getIdToken()
                            .getJwtToken(),
                    },
                });
 
                AWS.config.credentials.refresh(error => {
                    if (error) {
                        console.error(error);
                    } else {
                        var s3 = new AWS.S3();
                        var params = {Bucket:'mybucketapp', Key: fileName, Expires: 60};
                        s3.getSignedUrl('getObject', params, function (err, url) {
                            if(err){
                                res.status(404).send("No File Found")
                            }else{
                                res.send({key:url })
                            }
                        });
                    }
                });
            }else{
                res.status(400).send("User signed out")
            }
        })
    })
})

var server = app.listen(3000, ()=>{
    console.log('running on: ', server.address().port)
    //loginUserSession();
    //testCognito();
    //listBucket();
})

