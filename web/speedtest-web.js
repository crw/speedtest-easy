/*jslint node: true, unparam: true */
/**
 *
 * speedtest-easy (c) 2016 Craig Robert Wright <crw@crw.xyz>
 *
 *  This Source Code Form is subject to the terms of the Mozilla Public
 *  License, v. 2.0. If a copy of the MPL was not distributed with this
 *  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
"use strict";

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var SpeedtestSqlite = require('./model/speedtest-sqlite.js');


var port = process.env.PORT || 3000;
var filename = process.env.DB_FILENAME || '../sample/speedtest.sqlite';

var sql = new SpeedtestSqlite(filename);


app.use(express.static('public'));
app.use(express.static('bower_components'));


var router = express.Router();

/**
 * Ridiculous attempt at a self-documenting API. HATEOAS cries.
 */
router.get('/', function (req, res) {
    res.json({resources: [
        {
            resource: '/first',
            desc: 'Returns the first, presumably earliest, row from the database.'
        },
        {
            resource: '/range?start=<ISO_TIMESTAMP>&end=<ISO_TIMESTAMP>',
            desc: 'Returns a range of rows from the database, filtering on the ' +
                    '`start` timestamp. This is a simple text search.'
        },
        {
            resource: '/all',
            desc: 'Returns all rows from the database.'
        }
    ]});
});

/**
 * Returns the first row in the database, the premise being this is also
 * the earliest row. Not necessarily true, but most likely true.
 */
router.get('/first', function (req, res) {
    sql.first(function (err, row) {
        res.json(row);
    });
});


/**
 * Returns a range of rows between two dates. See the sqlite interface for
 * more information about argument format. This is the workhorse endpoint.
 */
router.get('/range', function (req, res) {
    sql.range(req.query.start, req.query.end, function (err, rows) {
        res.json(rows);
    });
});


/**
 * Returns a all rows.
 */
router.get('/all', function (req, res) {
    sql.all(function (err, rows) {
        res.json(rows);
    });
});


app.use('/api', router);

app.listen(port, function () {
    console.log('speeedtest-web listening on port ' + port + '!');
});
