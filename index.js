'use strict';

const express = require('express'),
      bodyParser = require('body-parser'),
      config = require('config'),
      app = express().use(bodyParser.json()),
      path = require('path'),
      session = require('express-session'),
      cookieParser = require('cookie-parser'),
      flash = require('connect-flash');

const _ = require('lodash'),
      moment = require('moment-timezone'),
      logger = require('winston'),
      dbUtils = require('./app/db_utils'),
      contestImporter = require('./app/contest_importer'),
      addContestHandler = require('./app/add_contest_handler');

// Logging levels: error, warn, info, verbose, debug, silly
const LOGGER_LEVEL = process.env.LOGGER_LEVEL || config.get('loggerLevel');
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
  timestamp: true,
  level: LOGGER_LEVEL,
});

if (process.env.NODE_ENV === 'production') {
  logger.info('Setting up New Relic.');
  require('newrelic');
}

moment.locale('ro');
moment.tz.setDefault('UTC');

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => logger.info('Server is listening...'));

// Keep contests in memory
let contests = [];
let manualContests = [];

// Fetch contests into memory from the db
dbUtils.getContests().then((dbContests) => {
  contests = dbContests;
});

// Middleware
app.use(cookieParser('secret'));
app.use(session({cookie: { maxAge: 60000 }}));
app.use(flash());
app.use(bodyParser.urlencoded({
    extended: true
}));

// Routes
app.get('/contests/:source', (req, res) => {
  const source = req.params.source.toLowerCase();

  if (source === 'other') {
    res.status(200).send(manualContests);
  } else {
    let filteredContests = _.filter(contests, (contest) => contest.source.toLowerCase() === source);
    filteredContests = filteredContests.map((contest) => _.omit(contest, 'source'));
    res.status(200).send(filteredContests);
  }
});

app.get('/admin', (req, res) => {
  res.render('admin', {
    flashMessages: req.flash('admin'),
  });
});

app.post('/add_contest', (req, res) => {
  addContestHandler.run(req.body).then((result) => {
    if (result) {
      req.flash('admin', 'Successfully added contest');
    } else {
      req.flash('admin', 'Error while adding contest!');
    }
    res.redirect('/admin');
  });
});

// Set up view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine','ejs');
app.engine('html', require('ejs').renderFile);

// Scrape the websites and save the data in the db
const CONTESTS_FETCH_INTERVAL = process.env.CONTESTS_FETCH_INTERVAL || config.get('contestsFetchInterval');

const refreshContests = () => {
  contestImporter.run().then((dbContests) => {
    contests = dbContests;
  });
  dbUtils.getManualContests().then((dbManualContests) => {
    dbManualContests = dbManualContests.map((contest) => {
      return {
        id: `other${ contest.id }`,
        name: contest.name,
        startTimeSeconds: contest.start_time,
        url: contest.url,
        sourceName: contest.source_name,
      };
    });
    manualContests = dbManualContests;
  });
  dbUtils.removeOldManualContests();
};

refreshContests();
setInterval(() => {
  refreshContests();
}, CONTESTS_FETCH_INTERVAL);
