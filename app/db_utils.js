'use strict';

const { Client } = require('pg');
const config = require('config'),
      _ = require('lodash'),
      logger = require("winston");

let db;

if (process.env.DATABASE_URL) {
  // production
  db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });
} else {
  // local
  const DB_CONNECTION_STRING = config.get('dbConnectionString');
  db = new Client({
    connectionString: DB_CONNECTION_STRING,
    ssl: false,
  });
}

db.connect();


const dbUtils = {
  /*
   * Fetches contests from the db.
   */
  getContests: (source) => {
    return new Promise((resolve, reject) => {
      const callback = (err, res) => {
        if (!err) {
          resolve(res.rows);
        } else {
          resolve([]);
        }
      };
      if (source) {
        db.query(`SELECT contest_id, name, start_time, url FROM contests WHERE source = $1`, [ source ], callback);
      } else {
        db.query(`SELECT contest_id, name, start_time, source, url FROM contests`, callback);
      }
    });
  },

  saveContests: (contests) => {
    const insertPromises = contests.map((contest) => {
      return new Promise((resolve, reject) => {
        db.query("INSERT INTO contests(contest_id, name, start_time, source, url) \
                  VALUES ($1, $2, $3, $4, $5) \
                  ON CONFLICT (contest_id, source) DO NOTHING",
                  [ contest.id, contest.name, contest.startTimeSeconds, contest.source, contest.url ], (err, res) => {
          if (err) {
            logger.error('Error while saving contests!');
            logger.error(err);
          }
          resolve();
        });
      });
    });

    return new Promise((resolve, reject) => {
      Promise.all(insertPromises).then(() => {
        resolve();
      });
    });
  },

  clearContests: () => {
    return new Promise((resolve, reject) => {
      db.query("TRUNCATE TABLE contests", (err, res) => {
        if (err) {
          logger.error('Error while clearing contests!');
          logger.error(err);
        }
        db.query("ALTER SEQUENCE contests_id_seq RESTART", (err, res) => {
          if (err) {
            logger.error('Error while reseting contests primary key!');
            logger.error(err);
          }
          resolve();
        });
      });
    });
  },

  addManualContest: (contest) => {
    return new Promise((resolve, reject) => {
      db.query("INSERT INTO manual_contests(name, start_time, url, source_name) \
                VALUES ($1, $2, $3, $4)",
                [ contest.name, contest.start_time, contest.url, contest.source_name ], (err, res) => {
        if (err) {
          logger.error('Error while saving manual contest!');
          logger.error(err);
          resolve(false);
        }
        resolve(true);
      });
    });
  },

  getManualContests: () => {
    return new Promise((resolve, reject) => {
      db.query("SELECT id, name, start_time, url, source_name\
                FROM manual_contests", (err, res) => {
        if (err) {
          logger.error('Error while fetching manual contests!');
          logger.error(err);
          resolve([]);
        }
        resolve(res.rows);
      });
    });
  },

  removeOldManualContests: () => {
    db.query(
      `DELETE FROM manual_contests WHERE start_time < extract(epoch from NOW())`,
      (err) => {
        if (err) {
          logger.error('Error while deleting old manual contests!');
          logger.error(err);
        }
      }
    );
  },
};

module.exports = dbUtils;