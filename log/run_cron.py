#!/usr/bin/env python

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