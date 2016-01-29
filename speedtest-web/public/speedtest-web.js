

function median(values) {
  // @see https://gist.github.com/caseyjustus/1166258
  values.sort( function(a,b) {return a - b;} );

  var half = Math.floor(values.length/2);

  if(values.length % 2)
    return values[half];
  else
    return (values[half-1] + values[half]) / 2.0;
}


function getMonthFromString(mon){

   var d = Date.parse(mon + "1, 2012");
   if(!isNaN(d)){
      return new Date(d).getMonth();
   }
   return -1;
 }


function getCurrentOptions() {
    var options = {},
        yearmonth = $('#specificity').val().split(' ');

    options['granularity'] = $('#granularity').val();
    options['year'] = parseInt(yearmonth[0], 10);
    options['month'] = getMonthFromString(yearmonth[1]);
    if (options['granularity'] === 'day') {
      options['day'] = parseInt($('#day').val());
    } else {
      options['day'] = null;
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
      }.bind(this),
      error: function(xhr, status, err) {
        console.error('/api/first', status, err.toString());
      }.bind(this)
    });
  }

}


function generateMonthValues(callback) {
  getFirstEntry(function (data) {
    var options = [],
        date = new Date(data.start),
        monthName = {
          0: 'Jan', 1: 'Feb', 2: 'Mar', 3: 'Apr', 4: 'May', 5: 'Jun',
          6: 'Jul', 7: 'Aug', 8: 'Sep', 9: 'Oct', 10: 'Nov', 11: 'Dec'
        };
    today = new Date();
    for (year = date.getFullYear(); year <= today.getFullYear(); year++) {
      month = (year === date.getFullYear()) ? date.getMonth() : 0;
      while ( month < 12 && !(year === today.getFullYear() && month > today.getMonth()) ) {
        options.push(year + ' ' + monthName[month]);
        month++
      }
    }
    $.each(options, function(key, value) {
       $('#specificity')
          .append($('<option>', { value : value })
          .text(value));
    });
    $('#specificity')[0].options[$('#specificity')[0].options.length-1].selected = true;
    callback();
  });
}

function generateDayValues(year, month) {

  getFirstEntry(function (data) {
    var daysInMonth, i;

    if ((new Date()).getMonth() === month) {
      daysInMonth = (new Date()).getDate();
    } else {
      daysInMonth = new Date(year, month+1, 0).getDate();
    }
    $('#day')[0].options.length = 0;

    var firstDate = new Date(data.start);

    if (firstDate.getMonth() === month) {
      i = firstDate.getDate();
    } else {
      i = 1;
    }
    for (i; i <= daysInMonth; i++) {
      $('#day')
        .append($('<option>', { value : i })
        .text(i));
    }

  });
}


function decorateToolTip(meta, value) {

  var output = "";

  value = (value == 0) ? "0" : value;

  output = output + "<span class='tooltip-value'>" + value + "Mbps</span>";
  meta = Chartist.deserialize(meta);
  output = output + "<p><span class='tooltip-meta'>" + meta.join(' ') + "</span></p>";
  return output;
}


// function processData(data) {
//   var opts = getCurrentOptions();

//   var month, key, i;

//   if (opts['granularity'] == 'month') {
//     month_data = {};
//     for (i = 0; i < data.length; i++) {
//       key = data[i].start.substring(0, 10);
//       if (!month[key]) {
//         month[key] = [];
//       }
//       month[].append(data[i])
//     }

//   } (else if opts['granularity'] === 'day') {

//   }

// }


function drawChart(start, end) {

  var data_uri = '/api/range';

  var successfn = function (data) {
    var spddata = { labels: [], series: [[], []] };

    if (data.length === 0) {
      console.log('Query returned no data: ', data);
      $('.data-error').css('display', 'block');
    } else {

      data.map( function(obj) {
        spddata.labels.push(new Date(obj.start).getHours());
        spddata.series[0].push({
          meta: [obj.hostname, obj.distance, obj.latency],
          value: parseInt(obj.down) / 1000
        });
        spddata.series[1].push({
          meta: [ obj.hostname, obj.distance, obj.latency],
          value: parseInt(obj.up) / 1000
        });
      });
      if (spddata.labels.length > 1000) {
        spddata.labels = spddata.labels.slice(-1001, -1);
        spddata.series[0] = spddata.series[0].slice(-1001, -1);
        spddata.series[1] = spddata.series[1].slice(-1001, -1);
      }

      $('.data-error').css('display', 'none');

    }

    new Chartist.Line('.ct-chart', spddata, {
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
    success: successfn.bind(this),
    error: function(xhr, status, err) {
      console.error(data_uri, status, err.toString());
    }.bind(this)
  });

}


function updateMenus() {
  if ($('#granularity').val() === 'day') {
    options = getCurrentOptions();
    generateDayValues(options['year'], options['month']);
    $('#day').css('display', 'inline');
  } else {
    $('#day').css('display', 'none');
  }
}


function updateMenusEvent(e) {
  updateMenus()
}


function updateChartEvent(e) {
  var opts = getCurrentOptions(),
      start, end;

  if ($('#granularity').val() === 'day') {

    start = (new Date(opts['year'], opts['month'], opts['day'])).toISOString();
    end = (new Date(opts['year'], opts['month'], opts['day']+1)).toISOString();

  } else if ($('#granularity').val() === 'month') {

    start = (new Date(opts['year'], opts['month'], 1)).toISOString();
    end = (new Date(opts['year'], opts['month']+1, 1)).toISOString();
  }
  drawChart(start, end);
}


$( document ).ready(function () {

  generateMonthValues(function() {
    var opts, start, end;

    opts = getCurrentOptions();
    start = (new Date(opts['year'], opts['month'], 1)).toISOString();
    end = (new Date(opts['year'], opts['month']+1, 1)).toISOString();

    drawChart(start, end);
  });

  $('#granularity').change(updateMenusEvent);
  $('#granularity').change(updateChartEvent);
  $('#specificity').change(updateMenusEvent);
  $('#specificity').change(updateChartEvent);
  $('#day').change(updateChartEvent);
});




