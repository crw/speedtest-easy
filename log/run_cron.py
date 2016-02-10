#!/usr/bin/env python

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

# run-cron.py
# Writes /etc/environment and runs cron

import os
from subprocess import call

env_keys = ['DB_FILENAME', 'LOG_FILENAME', 'KEEP_LOG']

with open('/etc/environment', 'w') as f:
	for key in env_keys:
		f.write(key + '=' + os.environ[key] + "\n")

args = ["cron", "-f", "-L 15"]
call(args)