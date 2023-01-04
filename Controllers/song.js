const {pool}  = require("../database.js");
const {poolreplica} = require("../repdatabase.js")
var bodyParser = require('body-parser');

exports.update_like = (req, res) => {
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
};

exports.update_view = (req, res) =>{
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
};

exports.search_general = (req, res) => {
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

    }else{
        var queryAdd = query + pagination;
    }

    poolreplica.getConnection(function(err, conn){
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
};

exports.filter_song = (req, res) =>{
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

        poolreplica.getConnection(function(err, conn){
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
};