'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.createTable('manual_contests', {
    id: {
      type: 'int',
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: 'string',
      notNull: true,
    },
    start_time: {
      type: 'integer',
      notNull: true,
    },
    url: {
      type: 'string',
      notNull: true,
    },
    source_name: 'string',
  });
};

exports.down = function(db) {
  return db.dropTable('manual_contests');
};

exports._meta = {
  "version": 1
};
