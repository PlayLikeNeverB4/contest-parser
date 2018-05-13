'use strict';

const _ = require('lodash'),
      logger = require('winston'),
      config = require('config'),
      dbUtils = require('./db_utils');

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || config.get('adminToken');

const addContestHandler = {
  run: (params) => {
    if (!params.token || params.token !== ADMIN_TOKEN) {
      logger.error('Wrong admin token!');
      return Promise.resolve(false);
    }
    if (params.name.length === 0 ||
        params.start_time.length === 0 ||
        params.url.length === 0) {
      logger.error('Field empty!');
      return Promise.resolve(false);
    }
    return dbUtils.addManualContest(params);
  },
};

module.exports = addContestHandler;