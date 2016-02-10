# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import sqlite3

class IntegrityError(sqlite3.IntegrityError):
    pass


class mysqlite(object):

    filename = 'speedtest.sqlite'
    conn = None

    schema = (
        { 'speedtest': [
            ('start',     'TEXT', 'PRIMARY KEY'),
            ('end',       'TEXT', ''),
            ('up',        'TEXT', ''),
            ('down',      'TEXT', ''),
            ('hostname',  'TEXT', ''),
            ('location',  'TEXT', ''),
            ('distance',  'TEXT', ''),
            ('latency',   'TEXT', ''),
        ]}
    )


    def __init__(self, filename=None):
        if filename:
            self.filename = filename
        self.open()
        self.initialize()


    def open(self):
        if self.conn:
            self.close()
        self.conn = sqlite3.connect(self.filename)


    def commit(self):
        if self.conn:
            self.conn.commit()


    def close(self):
        if self.conn:
            self.conn.close()


    def initialize(self):
        c = self.conn.cursor()
        for table_name in self.schema:
            columns = []
            for column_tuple in self.schema[table_name]:
                columns.append(' '.join(column_tuple))
            query = 'CREATE TABLE IF NOT EXISTS ' + table_name + \
                    '(' + ', '.join(columns) + ')'
            c.execute(query)
        self.commit()


    def insert(self, table, data):
        c = self.conn.cursor()
        cols_arr = []
        vals_arr = []
        for key in data:
            cols_arr.append(key)
            vals_arr.append(':'+key)
        s_cols = ','.join(cols_arr)
        s_vals = ','.join(vals_arr)
        query = 'INSERT INTO ' + table + \
                ' (' + s_cols + ') VALUES (' + s_vals + ')'
        try:
            c.execute(query, data)
        except sqlite3.IntegrityError:
            raise IntegrityError()
