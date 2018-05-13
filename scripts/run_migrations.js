'use strict';

const { exec } = require('child_process');
const config = require('config'),
      logger = require('winston');

const DATABASE_URL = process.env.DATABASE_URL ||
                     config.get('dbConnectionString');

exec(`DATABASE_URL=${ DATABASE_URL } node_modules/db-migrate/bin/db-migrate up`, (err, stdout, stderr) => {
  if (err) {
    logger.error("Migrations script returned with error!");
    logger.error(err);
    logger.error(`stderr: ${stderr}`);
    process.exit(1);
  }
  console.log(`stdout: ${stdout}`);
  console.log(`stderr: ${stderr}`);
  logger.info("Migrations script finished!");
});
