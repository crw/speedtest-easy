FROM node:5.5.0-wheezy

MAINTAINER Craig Wright <crw@crw.xyz>

ENV PORT=3000 \
	# Set to "1" if you want to permanently keep the raw log data.
	KEEP_LOG=0 \
	# To persist speedtest data across containers, set these to write to a
	# mounted volume rather than keeping the defaults.
	DB_FILENAME=/var/log/speedtest.sqlite \
	LOG_FILENAME=/var/log/speedtest.log

RUN apt-get update \
	&& apt-get install -y \
		cron \
		python-pip \
	&& pip install \
		speedtest-cli \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists/*

COPY /log/speedtest /etc/cron.hourly/speedtest

RUN service cron start

RUN mkdir /speedtest-easy

ADD ./web /speedtest-easy/web
ADD ./convert /speedtest-easy/convert

RUN cd /speedtest-easy/web && \
	npm install && \
	npm install -g bower && \
	bower --allow-root install

WORKDIR /speedtest-easy/web

EXPOSE $PORT

CMD ["node", "speedtest-web.js"]
