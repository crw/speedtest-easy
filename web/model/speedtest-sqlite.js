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

var sqlite3 = require('sqlite3').verbose();


/**
 * Interface for managing sqlite interactions
 * @constructor
 * @param {string} filename Location on disk of the sqlite database.
 */
function speedtest_sqlite(filename) {
    this.db = new sqlite3.Database(filename);
}

/**
 * Returns all rows between a start and end timestamp.
 * @method
 * @param {string} start ISO8601 datetime or fragment, inclusive.
 * @param {string} end ISO8601 datetime or fragment, inclusive.
 * @param {function} callback function to execute with response data.
 *
 * Note that there is no translation of the string to a date format;
 * we just do a string compare. This works as long as you use datetime
 * fragments such as "2016-02-02".
 */
speedtest_sqlite.prototype.range = function (start, end, callback) {

    var query,
        stmt = 'SELECT * FROM speedtest WHERE start >= ? AND start <= ?';

    query = this.db.prepare(stmt, start, end);
    query.all(callback);
};

/**
 * Returns the first row of data in the database.
 * @method
 * @param {function} callback function to execute with response data.
 */
speedtest_sqlite.prototype.first = function (callback) {

    var stmt = 'SELECT * FROM speedtest LIMIT 1';
    this.db.get(stmt, callback);
};

/**
 * Returns all rows of data in the database.
 * @method
 * @param {function} callback function to execute with response data.
 */
speedtest_sqlite.prototype.all = function (callback) {

    var stmt = 'SELECT * FROM speedtest';
    this.db.all(stmt, callback);
};

/**
 * Returns the number of rows of data in the database.
 * @method
 * @param {function} callback function to execute with response data.
 */
speedtest_sqlite.prototype.count = function (callback) {

    var stmt = 'SELECT COUNT(*) as count FROM speedtest';
    this.db.all(stmt, callback);
};

module.exports = speedtest_sqlite;
