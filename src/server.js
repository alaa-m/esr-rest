const express = require('express')
// Import the library:
var cors = require('cors');

const port = process.env.PORT || 5000

const app = express()
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set up a whitelist and check against it:
var whitelist = ['http://localhost:3000']
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

app.use(cors());
/*
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});*/

var routes = require('./api/routes/esrRoutes'); //importing route

routes(app); //register the route

app.listen(port, () => {
    console.log(`ESR REST API Listening on port ${port}`)
  })