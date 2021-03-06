#
# speedtest-easy (c) 2016 Craig Robert Wright <crw@crw.xyz>
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

from __future__ import print_function
import re
import sys
import sqlite3

import mysqlite as sql

"""TABLE_NAME and SCHEMA define the sqlite database."""
TABLE_NAME = 'speedtest'
SCHEMA = (
        { TABLE_NAME: [
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

def warning(*objs):
    """Wrapper around print to handle logging errors to STDERR."""
    print("WARNING: ", *objs, file=sys.stderr)


def convert_datetime(line):
    """Processes lines with datetimes, returning the ISO8601 string."""
    garbage, datetime = line.split(' ')
    return datetime


def convert_speed(line):
    """Processes the line with a speed number in it (up or down).

    Return value is always in kbps.
    """
    garbage, speed, unit = line.split(' ')
    multiplier = 1000 if unit == 'Mbit/s' else 1
    return int(float(speed)*multiplier)


def convert_host(line):
    """Processes the line with host information.

    Returns a dict, as the host line actually contains four bits of info.
    """
    m = re.match(r"Hosted by (.+) \((.+)\) \[(.+)\]\: (.+) ms", line)
    hostname, location, distance, latency = m.groups()
    return {
                'hostname': hostname,
                'location': location,
                'distance': distance,
                'latency': latency
            }


def from_stream(stream):
    """Processes a file or stream of speedtest log data.

    Since every line is essentially unique and non-programmatic output, we
    need to do detection and conversion differently for every line. We also
    need to keep track of matching start and end times.

    Warns if a sequence of lines is missing any data and skips that sequence.
    """
    data = []
    output = {}
    depth = 0
    for line in stream:
        line = line.strip()
        if line.find('-----Start:') == 0:
            if depth > 0:
                warning('Incomplete data!', output)
                depth = 0
            depth += 1
            output = { 'start': convert_datetime(line) }
        elif line.find('-----End:') == 0:
            output['end'] = convert_datetime(line)
            if 'start' not in output or \
                'down' not in output or \
                'up'   not in output or \
                'hostname' not in output or \
                'location' not in output or \
                'distance' not in output or \
                'latency'  not in output:
                warning('Incomplete data!', output)
            if 'start' in output and \
                'down' in output:
                data.append(output)
            depth = 0
            output = {}
        elif line.find('Download:') == 0:
            output['down'] = convert_speed(line)
        elif line.find('Upload:') == 0:
            output['up'] = convert_speed(line)
        elif line.find('Hosted by') == 0:
            output.update(convert_host(line))
    return data


def convert_log_to_sqlite(sqlite_filename, log_stream):
    """Handles farming out log conversion and writing the data to the database.
    """
    db = sql.mysqlite(sqlite_filename, SCHEMA)
    data = from_stream(log_stream)
    records = 0
    for datum in data:
        try:
            db.insert(TABLE_NAME, datum)
            records += 1
        except sql.IntegrityError:
            warning('Error: Insert: ID already exists: {}'
                    .format(datum['start']))
    db.commit()
    print('{} records inserted!'.format(records))


if __name__ == "__main__":
    """Manages CLI args and preps for execution."""
    if len(sys.argv) == 1:
        print("Usage: python speedtest-convert.py <sqlite_filename> <log_filename>")
        print()
        print("Note: if the log filename is excluded, the script will read from STDIN.")
        print()
        exit()
    if len(sys.argv) > 1:
        sqlite_filename = sys.argv[1]
    else:
        sqlite_filename = None
    if len(sys.argv) > 2:
        log_stream = open(sys.argv[2])
    else:
        log_stream = sys.stdin
    convert_log_to_sqlite(sqlite_filename, log_stream)
