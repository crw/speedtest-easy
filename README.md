# speedtest-easy
Hourly speedtest results, with a simple web-based chart, installed via a Docker container.

## Synopsis

Installing this project enables two bits of functionality: the hourly collection of speedtest data, and the ability to display that data in a simple web-based interface. The data is collected from the [speedtest-cli](https://github.com/sivel/speedtest-cli) command-line program. The data is stored in a sqlite database, which can be queried directly should you so desire.

## Quick Start

```bash
docker pull raitos/speedtest-easy
docker run -d -e DB_FILENAME=/speedtest-easy/sample/speedtest.sqlite -p 3000:3000 --name speedtest-easy raitos/speedtest-easy
```

This will run the container image using the sample dataset. This should allow you to poke around with the web interface on http://your_docker_host:3000/. The sample dataset has date from around 27-Dec-2015 to 08-Feb-2016. Any days outside of that window will display the error "No Data." Note, if you allow this container to keep running, it will start logging data into the sample data database. This is meant as a sample exercise only.

To stop the container:

```
docker stop speedtest-easy

## And to remove (this will delete all data within the container!)
docker rm speedtest-easy
```

## Motivation

This project was birthed from my obsessive collecting of speedtest data, primarily to use as a "talking point" with Comcast. For more than a year I was simply running speedtest-cli via cron and not doing much with the data. This project is my way of exposing the data and making the the code portable for the future.

## Installation

### The Easy Way (with Docker)

```bash
docker pull raitos/speedtest-easy
docker run -d -p 3000:3000 --name speedtest-easy raitos/speedtest-easy
```

The following Docker environment variables can be set:

* **DB_FILENAME** _(var/data/speedtest.sqlite)_: the location of the sqlite database.
* **LOG_FILENAME** _(/var/data/speedtest.log)_: the location of the raw speedtest-cli logs
* **KEEP_LOG** _(0)_: if 0, logs are removed after use. Any other value, they are kept.
* **PORT** _(3000)_: Port through which to expose the web application.

#### Maintain your data with volumes

I recommend mounting a volume so that you can maintain your speedtest data between the execution of different containers. Just add `-v /my/local/folder:/var/data` to the `docker run` command. If you do not do this, all collected speedtest data will be deleted if you remove the container.

To manually run a speedtest:

```bash
docker exec speedtest-easy /etc/cron.hourly/speedtest
```

### The Hard Way (no Docker)

Clone this project, then do what the Dockerfile does. :) The easiest approach would be to copy the log/speedtest script into /etc/cron.hourly/, then edit the file to define the ENV variables and hard link to the appropriate scripts.

The node site can be run as follows:

```
## Install dependencies (first time)
cd speedtest-web && npm install && npm install -g bower && bower install

## Run the website
cd speedtest-web && node speedtest-web.js
```

## Methodology

Please see [speedtest-cli: Inconsistency](https://github.com/sivel/speedtest-cli#inconsistency) for information on the validity of this type of testing. You may see inconsistent results between these tests and [Speedtest.net](http://speedtest.net). The reasons for this are enumerated at the above referenced link.

## Contributors

Contributions welcome! Right now this project is very much a quick hack. If you decide to make changes, please contribute those changes back to the core repo. This project is using Github issue tracker to manage change requests, feel free to file a bug or feature request after checking to see if your concern is already being tracked.

## License

This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at <http://mozilla.org/MPL/2.0/>.
