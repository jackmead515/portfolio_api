global.__basedir = __dirname;

const express = require('express');
const bodyParser = require('body-parser');
const statusMonitor = require('express-status-monitor');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const RateLimit = require('express-rate-limit');
const services = require('./services/v1/');
const { authenticate } = require('./middleware/authenticate');

var app = express();

//############# MIDDLEWARE
app.use(compression());
app.use(helmet());

app.use('/api/v1/', new RateLimit({
  windowMs: 30*60*1000, //30 minutes
  max: 10000, //10,00 API requests
  delayMs: 0,
}));

const accessControl = process.env.PROD === 'true' ? "http://www.speblog.org" : "*";
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", accessControl);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/images', express.static(path.join(__dirname, 'images')));

const statMonitor = statusMonitor({path: ''});
app.use(statMonitor.middleware);
app.get('/status', authenticate, statMonitor.pageRoute);
//########################

//############### INTERFACE
const staticRoute = express.static(path.join(__dirname, 'build'));
app.use('/', staticRoute);
app.use('/*', staticRoute);
app.use('/admin', staticRoute);
app.use('/admin/*', staticRoute);
app.use('/login', staticRoute);
//#########################

//############### SERVICES
app.use('/api/v1/guides', services.guides);
app.use('/api/v1/tracking', services.tracking);
app.use('/api/v1/topics', services.topics);
app.use('/api/v1/login', services.login);
app.use('/api/v1/comments', services.comments);
app.use('/api/v1/search', services.search);
app.use('/api/v1/admin', services.admin);
//########################


var port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log("\n\n\n----------- portfolio_api booted -----------\n\n\n")
});
