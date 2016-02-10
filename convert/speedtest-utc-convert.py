# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import sys
import re
import datetime
import pytz


def convert_datetime(line):
    garbage, datetime = line.split(' ')
    return datetime


def convert_to_utc(isotimestamp):
    isotimefmt = '%Y-%m-%dT%H:%M:%S'
    timestamp = isotimestamp[:-5]
    tzoffset = isotimestamp[-5:]
    if tzoffset == '+0000':
        return isotimestamp
    else:
        dt = datetime.datetime.strptime(timestamp, isotimefmt)
    local = pytz.timezone("America/Los_Angeles")
    is_dst = tzoffset == '-0700'
    local_dt = local.localize(dt, is_dst=is_dst)
    utc_dt = local_dt.astimezone(pytz.utc)
    return utc_dt.strftime(isotimefmt) + '+0000'



if __name__ == "__main__":
    if sys.argv[1] != None:
        stream = open(sys.argv[1], 'r')
    else:
        stream = sys.stdin

    for line in stream:
        line = line.strip()
        if line.find('-----Start:') == 0:
            iso_ts = convert_to_utc(convert_datetime(line))
            print '-----Start: ' + iso_ts
        elif line.find('-----End:') == 0:
            iso_ts = convert_to_utc(convert_datetime(line))
            print '-----End: ' + iso_ts
        else:
            print line

