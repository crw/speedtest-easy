var sqlite3 = require('sqlite3').verbose();


function speedtest_sqlite (filename) {
	this.db = new sqlite3.Database(filename);
}

speedtest_sqlite.prototype.range = function(start, end, callback) {

	var stmt = 'SELECT * FROM speedtest WHERE start >= ? AND end <= ?';
	var query;

	query = this.db.prepare(stmt, start, end);
	query.all(callback);
}

speedtest_sqlite.prototype.first = function(callback) {

	var stmt = 'SELECT * FROM speedtest LIMIT 1';
	this.db.get(stmt, callback);
}

speedtest_sqlite.prototype.all = function(callback) {

	var stmt = 'SELECT * FROM speedtest';
	this.db.all(stmt, callback);
}

speedtest_sqlite.prototype.count = function(callback) {

	var stmt = 'SELECT COUNT(*) as count FROM speedtest';
	this.db.all(stmt, callback);
}

module.exports = speedtest_sqlite;
