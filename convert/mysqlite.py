#
# speedtest-easy (c) 2016 Craig Robert Wright <crw@crw.xyz>
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import sqlite3

class IntegrityError(sqlite3.IntegrityError):
    """Wrapper allows the calling script to not need to import sqlite3."""
    pass


class mysqlite(object):
    """Simple sqlite interface."""

    filename = None
    schema = None
    conn = None


    def __init__(self, filename, schema):
        """Open and initializes a sqlite database.

        filename: str; location on disk of the sqlite db.
        schema: tuple of dict; schema definition for the sqlite db.
            ex. ( { tablename: [col_name, col_type, modifiers], [...] }, {...} )
        """
        if filename:
            self.filename = filename
        if schema:
            self.schema = schema
        self.open()
        self.initialize()


    def open(self):
        """Open a connection to a sqlite database (creates a connection object)
        """
        if self.conn:
            self.close()
        self.conn = sqlite3.connect(self.filename)


    def commit(self):
        """Commits outstanding transaction."""
        if self.conn:
            self.conn.commit()


    def close(self):
        """Closes the connection to the sqlite database."""
        if self.conn:
            self.conn.close()


    def initialize(self):
        """Creates tables from schema, if not already created.

        No attempt is made to ALTER TABLE should the schema change. If the
        table name is found, it is simply not created.
        """
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
        """Inserts one row of data into the sqlite database.

        table: string; name of the table into which to insert.
        data: dict; keys are column names, values are row values.
        """
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
