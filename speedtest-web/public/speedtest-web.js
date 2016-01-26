
function decorateToolTip(meta, value) {

  var output = "";

  value = (value == 0) ? "0" : value;

  output = output + "<span class='tooltip-value'>" + value + "kbps</span>";
  meta = Chartist.deserialize(meta);
  for (i = 0; i < meta.length; i++) {
    output = output + "<p><span class='tooltip-meta'>" + meta[i] + "</span></p>";
  }
  return output;
}


function drawChart(start, end) {

  var data = {
    // A labels array that can contain any sort of values
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    // Our series array that contains series objects or in this case series data arrays
    series: [
      [
        {
          meta: ['Comcast 25.6ms 15.5 miles'],
          value: 5
        }, {
          meta: ['Comcast 25.6ms 15.5 miles'],
          value: 2
        }, {
          meta: ['Comcast 25.6ms 15.5 miles'],
          value: 4
        }, {
          meta: ['Comcast 25.6ms 15.5 miles'],
          value: 2
        }, {
          meta: ['Comcast 25.6ms 15.5 miles'],
          value: 0
        }
      ]
    ]
  };

  // Create a new line chart object where as first parameter we pass in a selector
  // that is resolving to our chart container element. The Second parameter
  // is the actual data object.
  new Chartist.Line('.ct-chart', data, {
      plugins: [
          Chartist.plugins.tooltip({
              tooltipFnc: decorateToolTip
          })
      ]
  });
}



$( document ).ready(drawChart('a', 'b'));