'use strict';

const _ = require('lodash'),
      logger = require('winston'),
      dbUtils = require('./db_utils'),
      atcoderScraper = require('./scrapers/atcoder_scraper');

const scrapers = [ atcoderScraper ];

const contestImporter = {
  /*
   * Fetches contests by parsing the HTML and then saves them into the db.
   */
  run: () => {
    return new Promise((resolve, reject) => {
      logger.info('Running scrapers...');
      const scraperPromises = scrapers.map((scraper) => scraper.run());
      Promise.all(scraperPromises).then((results) => {
        const contests = _.flatten(results);
        logger.info(`Found ${ contests.length } contests.`);
        logger.verbose(contests);
        dbUtils.clearContests().then(() => {
          logger.info('Cleared contests from the db.');
          dbUtils.saveContests(contests).then(() => {
            logger.info('Saved contests into the db.');
            resolve(contests);
          });
        });
      });
    });
  },
};

module.exports = contestImporter;