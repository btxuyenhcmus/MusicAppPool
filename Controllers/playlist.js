const path = require('path'); 
require('dotenv').config({ path: path.join(__dirname, '.env') });
const {pool}  = require("../database.js");
const {poolreplica} = require("../repdatabase.js")
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var jwkToPem = require('jwk-to-pem');

exports.add_playlist = (req, res) => {
    var title = req.body.title;
    var playlist_description = req.body.playlist_description;

    var accessToken = req.body.accessToken;
    var jwk = {"keys":[{"alg":"RS256","e":"AQAB","kid":"CpYfQP1KwhKcibRZ4kRXQHag8zM/Tk5O1aKogCLpjmY=","kty":"RSA","n":"wY_HvAZADavIL5JygtKNdP19Zza8BErCcHMupduKjPjZDnHLTnATuGpcMk5Xf2CBq8LprxLaB9ZmtI7WvJVQG0pkJ6IvQPeS-g4bZOz9giHmhGmzg7M9ZFIhSGS-NbFQx0-Sbo5AssL_I6OkMWHOotLuSe4gNTeUvYgxC2OhLFznGPLvar_giGRxPU2JDf5wZozTFyxcST5BP6OmfQKdIeljRItD4Ph0-5xNe8kkkLHYNmGPKtSv4-_VeKz-AY6oOwtZEYkVdz4UZRreExL2ZE5AUZVhwmYM1Cv_bXJQgHdUO-LZF0p3J4TScoaIwFuYQbAM2i0WuvTJ3jqgr7l2fw","use":"sig"},{"alg":"RS256","e":"AQAB","kid":"VBbR/gPvOEm5gMWpmDN1/qGvLE6C6qCFUTxGaBgf/Cc=","kty":"RSA","n":"te4PHvB44aaOLnnw2ATsu1SAPlZ_R0tyrgAmLipA4Nc2ROIJPbNMrAOCsho1YP5uBifKRIX3NGiNABUaH_ESXoBupK3ki9cwivrrM8r6Bxi2pakm3Iyz4rFgtJr2M3WOAtDlJ0GuWNR-yGt_cqyKLu9Ye-6IzI9Z5Z6WjPzwCGRCAQF1pTP6iO5Rfp-J_uh0dFBLT_mrAvUq2_IVdneOt7y1_lj9QXDoMrLm5oZKpcNb3KqqOEdJrbyKfKl8L6W0I24ij2qTbj7kiEtjweMlydJSzJS20RuhGk8BYOPqVt5xeaZpGXPkWocOF2ptbrEh9-w16R8uNTGpRKnLSrQ2OQ","use":"sig"}]};
    var pem = jwkToPem(jwk.keys[1]);
    jwt.verify(accessToken, pem,{algorithms: ["RS256"]} , function(err, decoded) {
        if(err){
            res.status(400).send(err);
            return
        }
        var getUserId = "SELECT id FROM `user` WHERE username = '" + decoded.username + "'";
        pool.getConnection(function(err, conn){
            if(err){
                console.log("aaaaaa")
                res.status(400).send("can't connect to the database")
            }
            conn.query(getUserId, function(err, result) {
                if(err){
                    console.log(err)
                    res.status(400).send(err["sqlMessage"]);
                    return;
                }
                    var data = {
                        title: title,
                        playlist_description: playlist_description,
                        user_id: result[0].id
                    }
                    
                    var query = "INSERT INTO `playlist_owner` SET ?"
                    conn.query(query,[data] , function(err, result) {
                        if(err){
                            res.status(400).send(err["sqlMessage"]);
                            return;
                        }
                        res.send(result);
                    })
                conn.release();
            })
        })
    })
};

exports.delete_playlist = (req, res) =>{
    var id = req.query.playlist_id;

    var accessToken = req.body.accessToken;
    var jwk = {"keys":[{"alg":"RS256","e":"AQAB","kid":"CpYfQP1KwhKcibRZ4kRXQHag8zM/Tk5O1aKogCLpjmY=","kty":"RSA","n":"wY_HvAZADavIL5JygtKNdP19Zza8BErCcHMupduKjPjZDnHLTnATuGpcMk5Xf2CBq8LprxLaB9ZmtI7WvJVQG0pkJ6IvQPeS-g4bZOz9giHmhGmzg7M9ZFIhSGS-NbFQx0-Sbo5AssL_I6OkMWHOotLuSe4gNTeUvYgxC2OhLFznGPLvar_giGRxPU2JDf5wZozTFyxcST5BP6OmfQKdIeljRItD4Ph0-5xNe8kkkLHYNmGPKtSv4-_VeKz-AY6oOwtZEYkVdz4UZRreExL2ZE5AUZVhwmYM1Cv_bXJQgHdUO-LZF0p3J4TScoaIwFuYQbAM2i0WuvTJ3jqgr7l2fw","use":"sig"},{"alg":"RS256","e":"AQAB","kid":"VBbR/gPvOEm5gMWpmDN1/qGvLE6C6qCFUTxGaBgf/Cc=","kty":"RSA","n":"te4PHvB44aaOLnnw2ATsu1SAPlZ_R0tyrgAmLipA4Nc2ROIJPbNMrAOCsho1YP5uBifKRIX3NGiNABUaH_ESXoBupK3ki9cwivrrM8r6Bxi2pakm3Iyz4rFgtJr2M3WOAtDlJ0GuWNR-yGt_cqyKLu9Ye-6IzI9Z5Z6WjPzwCGRCAQF1pTP6iO5Rfp-J_uh0dFBLT_mrAvUq2_IVdneOt7y1_lj9QXDoMrLm5oZKpcNb3KqqOEdJrbyKfKl8L6W0I24ij2qTbj7kiEtjweMlydJSzJS20RuhGk8BYOPqVt5xeaZpGXPkWocOF2ptbrEh9-w16R8uNTGpRKnLSrQ2OQ","use":"sig"}]};
    var pem = jwkToPem(jwk.keys[1]);

    jwt.verify(accessToken, pem,{algorithms: ["RS256"]} , function(err, decoded) {
        if(err){
            res.status(400).send(err);
            return
        }
        var getUserId = "SELECT id FROM `user` WHERE username = '" + decoded.username + "'";
        pool.getConnection(function(err, conn){
            if(err){
                console.log("aaaaaa")
                res.status(400).send("can't connect to the database")
            }
            conn.query(getUserId, function(err, result) {
                if(err){
                    console.log(err)
                    res.status(400).send(err["sqlMessage"]);
                    return;
                }
                    var query = "DELETE FROM `playlist_owner` WHERE id = " + id + " and user_id = " + result[0].id;
                    conn.query(query, function(err, result) {
                        if(err){
                            res.status(400).send(err["sqlMessage"]);
                            return;
                        }
                        res.send(result);
                    })
                conn.release();
            })
        })
    })
};

exports.update_playlist = (req, res) => {
    var playlist_id = req.query.playlist_id;
    var title = req.body.title;
    var playlist_description = req.body.playlist_description;

    var accessToken = req.body.accessToken;
    var jwk = {"keys":[{"alg":"RS256","e":"AQAB","kid":"CpYfQP1KwhKcibRZ4kRXQHag8zM/Tk5O1aKogCLpjmY=","kty":"RSA","n":"wY_HvAZADavIL5JygtKNdP19Zza8BErCcHMupduKjPjZDnHLTnATuGpcMk5Xf2CBq8LprxLaB9ZmtI7WvJVQG0pkJ6IvQPeS-g4bZOz9giHmhGmzg7M9ZFIhSGS-NbFQx0-Sbo5AssL_I6OkMWHOotLuSe4gNTeUvYgxC2OhLFznGPLvar_giGRxPU2JDf5wZozTFyxcST5BP6OmfQKdIeljRItD4Ph0-5xNe8kkkLHYNmGPKtSv4-_VeKz-AY6oOwtZEYkVdz4UZRreExL2ZE5AUZVhwmYM1Cv_bXJQgHdUO-LZF0p3J4TScoaIwFuYQbAM2i0WuvTJ3jqgr7l2fw","use":"sig"},{"alg":"RS256","e":"AQAB","kid":"VBbR/gPvOEm5gMWpmDN1/qGvLE6C6qCFUTxGaBgf/Cc=","kty":"RSA","n":"te4PHvB44aaOLnnw2ATsu1SAPlZ_R0tyrgAmLipA4Nc2ROIJPbNMrAOCsho1YP5uBifKRIX3NGiNABUaH_ESXoBupK3ki9cwivrrM8r6Bxi2pakm3Iyz4rFgtJr2M3WOAtDlJ0GuWNR-yGt_cqyKLu9Ye-6IzI9Z5Z6WjPzwCGRCAQF1pTP6iO5Rfp-J_uh0dFBLT_mrAvUq2_IVdneOt7y1_lj9QXDoMrLm5oZKpcNb3KqqOEdJrbyKfKl8L6W0I24ij2qTbj7kiEtjweMlydJSzJS20RuhGk8BYOPqVt5xeaZpGXPkWocOF2ptbrEh9-w16R8uNTGpRKnLSrQ2OQ","use":"sig"}]};
    var pem = jwkToPem(jwk.keys[1]);
    jwt.verify(accessToken, pem,{algorithms: ["RS256"]} , function(err, decoded) {
        if(err){
            res.status(400).send(err);
            return
        }
        var getUserId = "SELECT id FROM `user` WHERE username = '" + decoded.username + "'";
        pool.getConnection(function(err, conn){
            if(err){
                res.status(400).send("can't connect to the database")
                return;
            }
            conn.query(getUserId, function(err, result) {
                if(err){
                    console.log(err)
                    res.status(400).send(err["sqlMessage"]);
                    return;
                }
                    var data = {
                        title: title,
                        playlist_description: playlist_description
                    }
                    
                    var query = "UPDATE `playlist_owner` SET ? WHERE id = ? and user_id = ?"
                    conn.query(query,[data, playlist_id, result[0].id] , function(err, result) {
                        if(err){
                            res.status(400).send(err["sqlMessage"]);
                            return;
                        }
                        res.send(result)
                    })
                conn.release();
            })
        })
    })
};

exports.get_playlist_user = (req, res) =>{
    var accessToken = req.query.accessToken;
    var jwk = {"keys":[{"alg":"RS256","e":"AQAB","kid":"CpYfQP1KwhKcibRZ4kRXQHag8zM/Tk5O1aKogCLpjmY=","kty":"RSA","n":"wY_HvAZADavIL5JygtKNdP19Zza8BErCcHMupduKjPjZDnHLTnATuGpcMk5Xf2CBq8LprxLaB9ZmtI7WvJVQG0pkJ6IvQPeS-g4bZOz9giHmhGmzg7M9ZFIhSGS-NbFQx0-Sbo5AssL_I6OkMWHOotLuSe4gNTeUvYgxC2OhLFznGPLvar_giGRxPU2JDf5wZozTFyxcST5BP6OmfQKdIeljRItD4Ph0-5xNe8kkkLHYNmGPKtSv4-_VeKz-AY6oOwtZEYkVdz4UZRreExL2ZE5AUZVhwmYM1Cv_bXJQgHdUO-LZF0p3J4TScoaIwFuYQbAM2i0WuvTJ3jqgr7l2fw","use":"sig"},{"alg":"RS256","e":"AQAB","kid":"VBbR/gPvOEm5gMWpmDN1/qGvLE6C6qCFUTxGaBgf/Cc=","kty":"RSA","n":"te4PHvB44aaOLnnw2ATsu1SAPlZ_R0tyrgAmLipA4Nc2ROIJPbNMrAOCsho1YP5uBifKRIX3NGiNABUaH_ESXoBupK3ki9cwivrrM8r6Bxi2pakm3Iyz4rFgtJr2M3WOAtDlJ0GuWNR-yGt_cqyKLu9Ye-6IzI9Z5Z6WjPzwCGRCAQF1pTP6iO5Rfp-J_uh0dFBLT_mrAvUq2_IVdneOt7y1_lj9QXDoMrLm5oZKpcNb3KqqOEdJrbyKfKl8L6W0I24ij2qTbj7kiEtjweMlydJSzJS20RuhGk8BYOPqVt5xeaZpGXPkWocOF2ptbrEh9-w16R8uNTGpRKnLSrQ2OQ","use":"sig"}]};
    var pem = jwkToPem(jwk.keys[1]);
    jwt.verify(accessToken, pem,{algorithms: ["RS256"]} , function(err, decoded) {
        if(err){
            res.status(400).send(err);
            return
        }
        searchUser = "SELECT id FROM `user` WHERE username = '" + decoded.username + "'";
        listPlaylist = "SELECT * FROM `playlist_owner` WHERE user_id = (" + searchUser + ")";

        poolreplica.getConnection(function(err, conn){
            if(err){
                res.status(400).send("can't connect to the database")
                return
            }
            conn.query(listPlaylist, function(err, rows) {
                if(err){
                    res.status(400).send(err["sqlMessage"])
                    return
                }
                res.send(rows)
                conn.release();
            })
        })
    })
};
