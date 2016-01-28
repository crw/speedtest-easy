

function median(values) {
  // @see https://gist.github.com/caseyjustus/1166258
  values.sort( function(a,b) {return a - b;} );

  var half = Math.floor(values.length/2);

  if(values.length % 2)
    return values[half];
  else
    return (values[half-1] + values[half]) / 2.0;
}


function generateMonthValues() {

  function successfn(data) {
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
  }

  $.ajax({
    url: '/api/first',
    dataType: 'json',
    type: 'GET',
    success: successfn.bind(this),
    error: function(xhr, status, err) {
      console.error('/api/first', status, err.toString());
    }.bind(this)
  });
}


function decorateToolTip(meta, value) {

  var output = "";

  value = (value == 0) ? "0" : value;

  output = output + "<span class='tooltip-value'>" + value + "Mbps</span>";
  meta = Chartist.deserialize(meta);
  for (i = 0; i < meta.length; i++) {
    output = output + "<p><span class='tooltip-meta'>" + meta[i] + "</span></p>";
  }
  return output;
}


function drawChart(start, end) {

  var data_uri = '/api/all';

  var successfn = function (data) {
    var spddata = { labels: [], series: [[], []] };

    data.map( function(obj) {
      spddata.labels.push(new Date(obj.start).getHours());
      spddata.series[0].push({
        meta: [ obj.hostname, obj.distance, obj.latency],
        value: parseInt(obj.down) / 1000
      });
      spddata.series[1].push({
        meta: [ obj.hostname, obj.distance, obj.latency],
        value: parseInt(obj.up) / 1000
      });
    });
    if (spddata.labels.length > 100) {
      spddata.labels = spddata.labels.slice(-30, -1);
      spddata.series[0] = spddata.series[0].slice(-31, -1);
      spddata.series[1] = spddata.series[1].slice(-31, -1);
    }
    console.log(spddata);
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
    dataType: 'json',
    type: 'GET',
    success: successfn.bind(this),
    error: function(xhr, status, err) {
      console.error(data_uri, status, err.toString());
    }.bind(this)
  });

}


$( document ).ready(function () {
  generateMonthValues();
  drawChart('a', 'b');
  $('#granularity').change(function() {
    if ($('#granularity').val() === 'day') {
      $('#day').css('display', 'inline');
    } else {
      $('#day').css('display', 'none');
    }
  });
});