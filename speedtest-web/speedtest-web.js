/*jslint node: true, unparam: true */
"use strict";

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var SpeedtestSqlite = require('./model/speedtest-sqlite.js');


var port = process.env.PORT || 3000;
var filename = process.env.DB_FILENAME || '../speedtest.sqlite';

var sql = new SpeedtestSqlite(filename);


app.use(express.static('public'));
app.use(express.static('bower_components'));


var router = express.Router();

router.get('/', function (req, res) {
    res.json({'message': 'Hello World!'});
});


router.get('/first', function (req, res) {
    sql.first(function (err, row) {
        res.json(row);
    });
});


router.get('/range', function (req, res) {
    sql.range(req.query.start, req.query.end, function (err, rows) {
        res.json(rows);
    });
});


router.get('/all', function (req, res) {
    sql.all(function (err, rows) {
        res.json(rows);
    });
});


app.use('/api', router);

app.listen(port, function () {
    console.log('speeedtest-web listening on port ' + port + '!');
});
