#
# speedtest-easy (c) 2016 Craig Robert Wright <crw@crw.xyz>
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

FROM node:5.5.0-wheezy

MAINTAINER Craig Wright <crw@crw.xyz>

ENV PORT=3000 \
	# Set to "1" if you want to permanently keep the raw log data.
	KEEP_LOG=0 \
	# To persist speedtest data across containers, set these to write to a
	# mounted volume rather than keeping the defaults.
	DB_FILENAME=/var/data/speedtest.sqlite \
	LOG_FILENAME=/var/data/speedtest.log

RUN apt-get update \
	&& apt-get install -y \
		supervisor \
		cron \
		anacron \
		python-pip \
	&& pip install \
		speedtest-cli \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists/* \
	&& touch /var/log/cron \
	&& mkdir /speedtest-easy /var/data

COPY /log/speedtest       /etc/cron.hourly/speedtest
COPY /log/supervisor.conf /etc/supervisor/conf.d/supervisord.conf

ADD ./log/run_cron.py /root/run_cron.py

ADD ./web     /speedtest-easy/web
ADD ./convert /speedtest-easy/convert
ADD ./sample  /speedtest-easy/sample

RUN cd /speedtest-easy/web && \
	npm install && \
	npm install -g bower && \
	bower --allow-root install

VOLUME /var/data

EXPOSE $PORT

CMD ["/usr/bin/supervisord"]
