'use strict';

const express = require('express'),
      bodyParser = require('body-parser'),
      config = require('config'),
      app = express().use(bodyParser.json()),
      path = require('path');

const _ = require('lodash'),
      moment = require('moment-timezone'),
      logger = require('winston'),
      dbUtils = require('./app/db_utils'),
      contestImporter = require('./app/contest_importer');

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

Fetch contests into memory from the db
dbUtils.getContests().then((dbContests) => {
  contests = dbContests;
});

app.get('/contests/:source', (req, res) => {
  const source = req.params.source.toLowerCase();
  let filteredContests = _.filter(contests, (contest) => contest.source.toLowerCase() === source);
  filteredContests = filteredContests.map((contest) => _.omit(contest, 'source'));
  res.status(200).send(filteredContests);
});

// Scrape the websites and save the data in the db
const CONTESTS_FETCH_INTERVAL = process.env.CONTESTS_FETCH_INTERVAL || config.get('contestsFetchInterval');

const refreshContests = () => {
  contestImporter.run().then((dbContests) => {
    contests = dbContests;
  });
};

refreshContests();
setInterval(() => {
  refreshContests();
}, CONTESTS_FETCH_INTERVAL);
