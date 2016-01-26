var express = require('express');
var app = express();

app.use(express.static('public'));
app.use(express.static('bower_components'));

app.get('/api/range', function (req, res) {
  res.send('Hello World!');
});

app.listen(3000, function () {
  console.log('speeedtest-web listening on port 3000!');
})

