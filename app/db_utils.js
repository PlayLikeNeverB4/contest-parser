'use strict';

const { Client } = require('pg');
const config = require('config'),
      _ = require('lodash'),
      logger = require("winston");

let db;

console.log("before db");
if (process.env.DATABASE_URL) {
  // production
  console.log("before db - production");
  db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });
  console.log("after db - production");
} else {
  // local
  const DB_CONNECTION_STRING = config.get('dbConnectionString');
  db = new Client({
    connectionString: DB_CONNECTION_STRING,
    ssl: false,
  });
}

console.log("before connect");
db.connect();
console.log("after connect");


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
        db.query(`SELECT contest_id, name, start_time FROM contests WHERE source = $1`, [ source ], callback);
      } else {
        db.query(`SELECT contest_id, name, start_time, source FROM contests`, callback);
      }
    });
  },

  saveContests: (contests) => {
    const insertPromises = contests.map((contest) => {
      return new Promise((resolve, reject) => {
        db.query("INSERT INTO contests(contest_id, name, start_time, source) \
                  VALUES ($1, $2, $3, $4) \
                  ON CONFLICT (contest_id, source) DO NOTHING",
                  [ contest.id, contest.name, contest.startTimeSeconds, contest.source ], (err, res) => {
          if (err) {
            logger.error('Error while saving contests!');
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
        }
        db.query("ALTER SEQUENCE contests_id_seq RESTART", (err, res) => {
          if (err) {
            logger.error('Error while reseting contests primary key!');
          }
          resolve();
        });
      });
    });
  }
};

module.exports = dbUtils;