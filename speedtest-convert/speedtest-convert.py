from __future__ import print_function
import re
import sys
import sqlite3
from pprint import pprint

import mysqlite as sql


sqlite_file = 'speedtest.sqlite'


def warning(*objs):
    print("WARNING: ", *objs, file=sys.stderr)


def convert_datetime(line):
    garbage, datetime = line.split(' ')
    return datetime


def convert_speed(line):
    garbage, speed, unit = line.split(' ')
    multiplier = 1000 if unit == 'Mbit/s' else 1
    return int(float(speed)*multiplier)


def convert_host(line):
    m = re.match(r"Hosted by (.+) \((.+)\) \[(.+)\]\: (.+) ms", line)
    hostname, location, distance, latency = m.groups()
    return {
                'hostname': hostname,
                'location': location,
                'distance': distance,
                'latency': latency
            }


def from_stream(stream):
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


if __name__ == "__main__":

    db = sql.mysqlite()
    data = from_stream(sys.stdin)
    records = 0
    for datum in data:
        try:
            db.insert('speedtest', datum)
            records += 1
        except sql.IntegrityError:
            warning('Error: Insert: ID already exists: {}'
                    .format(datum['start']))
    db.commit()
    print('{} records inserted!'.format(records))
