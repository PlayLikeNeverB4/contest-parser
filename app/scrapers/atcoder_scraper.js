'use strict';

const moment = require('moment-timezone'),
      baseScraper = require('./base_scraper');

class atcoderScraper extends baseScraper {
  static parseContests($) {
    const upcomingContestsTable = $(".table-responsive:nth-of-type(2) > table");
    const contests = upcomingContestsTable.find("> tbody > tr").map((index, row) => {
      const url = $(row).find("> td:nth-of-type(2) a").attr("href");
      const id = url.match(/\/\/(\w*)\..*/)[1];
      const name = $(row).find("> td:nth-of-type(2) a").text();
      const isoTimestamp = $(row).find("> td:nth-of-type(1) a").attr("href").match(/.*\?iso=([\w\d]*)\&/)[1];
      const startTimeSeconds = moment.tz(isoTimestamp, "Asia/Tokyo").unix();

      return {
        id,
        name,
        startTimeSeconds,
        source: this.SOURCE_ID,
        url,
      };
    }).get();

    return contests;
  }
};

atcoderScraper.SOURCE_ID = 'ATCODER';
atcoderScraper.NAME = 'AtCoder';
atcoderScraper.SINGLE_PAGE_URL = 'https://atcoder.jp/contest';
// atcoderScraper.PAGINATED_PAGE_URL = 'https://atcoder.jp/contest/archive';
// atcoderScraper.PAGE_PARAM_NAME = 'p';

module.exports = atcoderScraper;
