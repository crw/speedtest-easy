/*jslint browser: true, unparam: true */
/*global
    $, Chartist
*/
/**
 *
 *  speedtest-easy (c) 2016 Craig Robert Wright <crw@crw.xyz>
 *
 *  This Source Code Form is subject to the terms of the Mozilla Public
 *  License, v. 2.0. If a copy of the MPL was not distributed with this
 *  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

(function () {
    "use strict";

    /**
     * Calculates the median of an array of number values.
     * @see https://gist.github.com/caseyjustus/1166258
     * @function
     * @param {array} values int or float.
     */
    function median(values) {
        values.sort(function (a, b) { return a - b; });

        var half = Math.floor(values.length / 2);

        if (values.length % 2) {
            return values[half];
        }
        return (values[half - 1] + values[half]) / 2.0;
    }


    /**
     * Returns month as an int, range 0 to 11.
     * @function
     * @param {string} mon string representation of the month.
     * return {int}
     */
    function getMonthFromString(mon) {

        var d = Date.parse(mon + "1, 2012");
        if (!isNaN(d)) {
            return new Date(d).getMonth();
        }
        return -1;
    }


    /**
     * Inspects the various page controls and returns an object with their
     * current settings.
     * @function
     * @return {object}
     */
    function getCurrentOptions() {
        var options = {},
            yearmonth = $('#specificity').val().split(' ');

        options.granularity = $('#granularity').val();
        options.year = parseInt(yearmonth[0], 10);
        options.month = getMonthFromString(yearmonth[1]);
        if (options.granularity === 'day') {
            options.day = parseInt($('#day').val(), 10);
        } else {
            options.day = null;
        }
        return options;
    }


    /**
     * Executes an ajax request to get the first database entry and calls a
     * callback with the results.
     * @function
     * @param {function} callback called with result data from successful request.
     */
    function getFirstEntry(callback) {
        if (getFirstEntry.cache) {
            callback(getFirstEntry.cache);
        } else {
            $.ajax({
                url: '/api/first',
                dataType: 'json',
                type: 'GET',
                success: function (data) {
                    getFirstEntry.cache = data;
                    callback(data);
                },
                error: function (xhr, status, err) {
                    console.error('/api/first', status, err.toString());
                }
            });
        }
    }


    /**
     * Generates the correct set of month values for the Month drop-down as
     * appropriate for the year and start-of-data context.
     * @function
     * @param {function} callback called with no arguments after completion.
     */
    function generateMonthValues(callback) {
        getFirstEntry(function (data) {
            var monthName = [
                    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                ],
                today = new Date(),
                date = new Date(data.start),
                options = [],
                year,
                month;

            for (year = date.getFullYear(); year <= today.getFullYear(); year += 1) {
                month = (year === date.getFullYear()) ? date.getMonth() : 0;
                while (month < 12 && !(year === today.getFullYear() && month > today.getMonth())) {
                    options.push(year + ' ' + monthName[month]);
                    month += 1;
                }
            }
            $.each(options, function (key, value) {
                $('#specificity')
                    .append($('<option>', { value : value }).text(value));
            });
            $('#specificity')[0].options[$('#specificity')[0].options.length - 1].selected = true;
            callback();
        });
    }

    /**
     * Generates the correct set of day values for the Day drop-down as
     * appropriate for the year, month, start- and end-of-data context.
     * @function
     * @param {int} year selected 4-digit year value
     * @param {int} month selected int month value (0..11)
     */
   function generateDayValues(year, month) {

        getFirstEntry(function (data) {
            var daysInMonth, i, firstDate;

            if ((new Date()).getMonth() === month) {
                daysInMonth = (new Date()).getDate();
            } else {
                daysInMonth = new Date(year, month+1, 0).getDate();
            }
            $('#day')[0].options.length = 0;

            firstDate = new Date(data.start);

            if (firstDate.getMonth() === month) {
                i = firstDate.getDate();
            } else {
                i = 1;
            }
            for (i; i <= daysInMonth; i += 1) {
                $('#day')
                    .append($('<option>', { value : i }).text(i));
            }
        });
    }


    /**
     * Chartist-plugin-tooltip decoraction function; decorates the chart tooltips.
     * @function
     * @param {str} meta Meta-data for the point being observed. Chartist-serialized
                         string, decodes to an array.
     * @param {int} value The value of the data point being observed.
     */
    function decorateToolTip(meta, value) {
        var output = "";
        value = (!value) ? "0" : value;
        output = output + "<span class='tooltip-value'>" + value + "Mbps</span>";
        meta = Chartist.deserialize(meta);
        output = output + "<p><span class='tooltip-meta'>" + meta.join(' ') + "</span></p>";
        return output;
    }

    /**
     * Converts data from the JSON representation to the format needed for Chartist.
     * For monthly values, we take the median of the hourly data.
     * For the day values, we naively assume there is only one data point per hour
     *     and that the data is delivered sorted by time, ascending.
     * @todo Sort data
     * @todo Genericize the median algorithm to apply to any specificity (minute, hour, month, day, year)
     * @function
     * @param {array} data delivered directly from the ajax response.
     */
    function processData(data) {
        var opts = getCurrentOptions(),
            chartist_data = { labels: [], series: [[], []] },
            day_map = {},
            date;

        if (opts.granularity === 'month') {
            data.map(function (obj) {
                date = new Date(obj.start).getDate();
                if (!day_map[date]) {
                    day_map[date] = { down: [], up: [], report: [] };
                }
                day_map[date].down.push(parseInt(obj.down, 10));
                day_map[date].up.push(parseInt(obj.up, 10));
                day_map[date].report.push(obj);
            });
            Object.keys(day_map).forEach(function (day, idx, arr) {
                chartist_data.labels.push(new Date(day_map[day].report[0].start).getDate());
                chartist_data.series[0].push({
                    meta: [],
                    value: median(day_map[day].down) / 1000
                });
                chartist_data.series[1].push({
                    meta: [],
                    value: median(day_map[day].up) / 1000
                });
            });
        } else if (opts.granularity === 'day') {

            data.map(function (obj) {
                chartist_data.labels.push(new Date(obj.start).getHours());
                chartist_data.series[0].push({
                    meta: [obj.hostname, obj.distance, obj.latency],
                    value: parseInt(obj.down, 10) / 1000
                });
                chartist_data.series[1].push({
                    meta: [ obj.hostname, obj.distance, obj.latency],
                    value: parseInt(obj.up, 10) / 1000
                });
            });
        }
        if (chartist_data.labels.length > 1000) {
            chartist_data.labels = chartist_data.labels.slice(-1001, -1);
            chartist_data.series[0] = chartist_data.series[0].slice(-1001, -1);
            chartist_data.series[1] = chartist_data.series[1].slice(-1001, -1);
        }
        return chartist_data;
    }


    /**
     * Draws the big chart based on a chosen starting and ending time.
     * @function
     * @param {string} start ISO8601 datetime fragment. ex. 2016-02-01
     * @param {string} end ISO8601 datetime fragment. ex. 2016-02-02
     */
    function drawChart(start, end) {

        var data_uri = '/api/range',

            successfn = function (data) {
                var chartist_data = { labels: [], series: [[], []] };

                if (data.length === 0) {
                    $('.data-error').css('display', 'block');
                } else {
                    $('.data-error').css('display', 'none');
                    chartist_data = processData(data);
                }
                new Chartist.Line('.ct-chart', chartist_data, {
                    plugins: [
                        Chartist.plugins.tooltip({
                            tooltipFnc: decorateToolTip
                        }),
                        Chartist.plugins.ctPointLabels({
                            textAnchor: 'middle'
                        })
                    ]
                });
            };

        $.ajax({
            url: data_uri,
            data: {
                start: start,
                end: end
            },
            dataType: 'json',
            type: 'GET',
            success: successfn,
            error: function(xhr, status, err) {
                console.error(data_uri, status, err.toString());
            }
        });
    }


    /**
     * Redraws the menus based on current selected option values.
     * @function
     */
    function updateMenus() {
        var options;
        if ($('#granularity').val() === 'day') {
            options = getCurrentOptions();
            generateDayValues(options.year, options.month);
            $('#day').css('display', 'inline');
        } else {
            $('#day').css('display', 'none');
        }
    }


    /**
     * Event wrapper for updateMenus()
     * @function
     * @param {object} e Event object
     */
    function updateMenusEvent(e) {
        updateMenus();
    }


    /**
     * Event called when changing dropdown menu items. Pulls options and redraws chart.
     * @function
     * @param {object} e Event object
     */
    function updateChartEvent(e) {
        var opts = getCurrentOptions(), start, end;

        if ($('#granularity').val() === 'day') {
            start = (new Date(opts.year, opts.month, opts.day)).toISOString();
            end = (new Date(opts.year, opts.month, opts.day+1)).toISOString();

        } else if ($('#granularity').val() === 'month') {
            start = (new Date(opts.year, opts.month, 1)).toISOString();
            end = (new Date(opts.year, opts.month+1, 1)).toISOString();
        }
        drawChart(start, end);
    }


    /**
     * Bootstrapper for a new page load. Draws the menus, gets the initial data,
     * draws the initial chart, registers event handlers.
     *
     */
    $(document).ready(function () {

        generateMonthValues(function () {
            var opts, start, end;

            opts = getCurrentOptions();
            start = (new Date(opts.year, opts.month, 1)).toISOString();
            end = (new Date(opts.year, opts.month+1, 1)).toISOString();

            drawChart(start, end);
        });

        $('#granularity').change(updateMenusEvent);
        $('#granularity').change(updateChartEvent);
        $('#specificity').change(updateMenusEvent);
        $('#specificity').change(updateChartEvent);
        $('#day').change(updateChartEvent);
    });

}());
