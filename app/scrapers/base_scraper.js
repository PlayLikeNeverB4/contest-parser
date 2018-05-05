'use strict';

const request = require('request'),
      cheerio = require('cheerio'),
      _ = require('lodash'),
      moment = require('moment');

class baseScraper {
  static run() {
    return new Promise((resolve, reject) => {
      Promise.all([
        this.runSinglePage(),
        this.runPaginatedPage()
      ]).then((results) => {
        const contests = _.flatten(results);
        resolve(contests);
      });
    });
  }

  static runSinglePage() {
    if (!this.SINGLE_PAGE_URL) {
      return [];
    }
    return new Promise((resolve, reject) => {
      request({
        "uri": this.SINGLE_PAGE_URL,
        "method": "GET"
      }, (error, result, body) => {
        if (!error) {
          const html = result.body;
          const $ = cheerio.load(html);
          const contests = this.parseContests($);
          resolve(contests);
        } else {
          logger.error(`[${ this.NAME }] Error at page request: ${ error }`);
        }
      });
    });
  }

  static runPaginatedPage() {
    if (!this.PAGINATED_PAGE_URL) {
      return [];
    }
    // TODO: implement this
    return [];
  }
};

module.exports = baseScraper;
