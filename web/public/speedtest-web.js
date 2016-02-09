/*jslint browser: true, unparam: true */
/*global
    $, Chartist
*/
(function () {
    "use strict";

    function median(values) {
        // @see https://gist.github.com/caseyjustus/1166258
        values.sort(function (a, b) { return a - b; });

        var half = Math.floor(values.length / 2);

        if (values.length % 2) {
            return values[half];
        }
        return (values[half - 1] + values[half]) / 2.0;
    }


    function getMonthFromString(mon) {

        var d = Date.parse(mon + "1, 2012");
        if (!isNaN(d)) {
            return new Date(d).getMonth();
        }
        return -1;
    }


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


    function decorateToolTip(meta, value) {
        var output = "";
        value = (!value) ? "0" : value;
        output = output + "<span class='tooltip-value'>" + value + "Mbps</span>";
        meta = Chartist.deserialize(meta);
        output = output + "<p><span class='tooltip-meta'>" + meta.join(' ') + "</span></p>";
        return output;
    }


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


    function updateMenusEvent(e) {
        updateMenus();
    }


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
