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
  return db.changeColumn('contests', 'url', {
    type: 'string',
    notNull: true,
    length: 100,
  });
};

exports.down = function(db) {
  return db.changeColumn('contests', 'url', {
    type: 'string',
    notNull: true,
    length: 50,
  });
};

exports._meta = {
  "version": 1
};
