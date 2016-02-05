FROM node:5.5.0-wheezy

MAINTAINER Craig Wright <crw@crw.xyz>

RUN apt-get update && apt-get install -y cron

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

EXPOSE 3000

CMD ["node", "speedtest-web.js"]
