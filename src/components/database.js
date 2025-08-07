"use strict";

const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

var db = null;
var log = () => { /* do nothing */ };

function initUptimed () {
  var query = `
    CREATE TABLE IF NOT EXISTS "uptimed" (
      "id" INTEGER UNIQUE,
      "system" INTEGER NOT NULL,
      "magicmirror" INTEGER NOT NULL
    )
  `;
  db.exec(query);

  const row = db.prepare("SELECT * FROM uptimed WHERE id = 0").get();
  if (!row) {
    db.exec("INSERT INTO uptimed (id, system, magicmirror) VALUES (0, 0, 0)");
    console.debug("[Bugsounet] [DB] Uptimed database created");
  }
}

function initLogin () {
  var query = `
    CREATE TABLE IF NOT EXISTS "login" (
      "id" INTEGER UNIQUE,
      "language" TEXT NOT NULL,
      "background" INTEGER NOT NULL
    )
  `;
  db.exec(query);

  const row = db.prepare("SELECT * FROM login WHERE id = 0").get();
  if (!row) {
    db.exec("INSERT INTO login (id, language, background) VALUES (0, 'en', 2)");
    console.debug("[Bugsounet] [DB] login database created");
  }
}

function initUsers () {
  var query = `
    CREATE TABLE IF NOT EXISTS "users" (
      "id" INTEGER UNIQUE,
      "disabled" BOOLEAN DEFAULT 0,
      "username" TEXT NOT NULL UNIQUE,
      "password" TEXT NOT NULL,
      "newPassword" BOOLEAN DEFAULT 0,
      "level" INTEGER NOT NULL DEFAULT 1,
      "avatar" INTEGER NOT NULL DEFAULT 1,
      "language" TEXT NOT NULL DEFAULT 'en',
      "background" INTEGER NOT NULL DEFAULT 2,
      "topbar" INTEGER NOT NULL DEFAULT 26,
      PRIMARY KEY("id" AUTOINCREMENT)
    )
  `;
  db.exec(query);

  const row = db.prepare("SELECT * FROM users WHERE id = 1").get();
  if (!row) {
    const newUser = {
      username: "admin",
      password: bcrypt.hashSync("admin", 10),
      newPassword: 1,
      level: 10,
      disabled: 1
    };
    const insert = db.prepare("INSERT INTO users (username, password, newPassword, level, disabled) VALUES (@username, @password, @newPassword, @level, @disabled)");

    insert.run(newUser);
    console.debug("[Bugsounet] [DB] users database created");
  }
}

function openDatabase (debug) {
  console.log("[Bugsounet] [DB] Open bugsounet database");
  if (debug) {
    log = (...args) => { console.debug("[Bugsounet] [DB]", ...args); };
    db = new Database("./modules/MMM-Bugsounet/databases/bugsounet.db", { verbose: log });
  } else {
    db = new Database("./modules/MMM-Bugsounet/databases/bugsounet.db");
  }
  if (!db) return console.error("[Bugsounet] [DB] Not initialized");
  initUptimed();
  initLogin();
  initUsers();
}
module.exports.openDatabase = openDatabase;

function updateFirstId (database, key, value) {
  if (!db) return console.error("[Bugsounet] [DB] Not initialized");
  const update = db.prepare(`UPDATE ${database} SET ${key} = ? WHERE id = 0`);
  update.run(value);
}
module.exports.updateFirstId = updateFirstId;

function getFirstId (database) {
  if (!db) {
    console.error("[Bugsounet] [DB] Not initialized");
    return {};
  }
  const row = db.prepare(`SELECT * FROM ${database} WHERE id = 0`).get();
  return row;
}
module.exports.getFirstId = getFirstId;

function getUsers () {
  if (!db) {
    console.error("[Bugsounet] [DB] Not initialized");
    return [];
  }
  const row = db.prepare("SELECT * FROM users").all();
  return row;
}
module.exports.getUsers = getUsers;

function getUserById (id) {
  if (!db) {
    console.error("[Bugsounet] [DB] Not initialized");
    return {};
  }
  const row = db.prepare(`SELECT * FROM users WHERE id = ${id}`).get();
  return row;
}
module.exports.getUserById = getUserById;

function getUserByUsername (username) {
  if (!db) {
    console.error("[Bugsounet] [DB] Not initialized");
    return {};
  }
  const row = db.prepare(`SELECT * FROM users WHERE username = '${username}'`).get();
  return row;
}
module.exports.getUserByUsername = getUserByUsername;

function updateUserById (id, key, value) {
  if (!db) {
    console.error("[Bugsounet] [DB] Not initialized");
    return {};
  }
  const update = db.prepare(`UPDATE users SET ${key} = ? WHERE id = ${id}`);
  update.run(value);
}
module.exports.updateUserById = updateUserById;

/*
process.on("exit", () => {
  console.warn("[Bugsounet] [DB] Closed (exit)");
  db.close();
});

process.on("SIGHUP", () => {
  console.warn("[Bugsounet] [DB] Closed (SIGHUP)");
  process.exit(128 + 1);
});

process.on("SIGINT", () => {
  console.warn("[Bugsounet] [DB] Closed (SIGINT)");
  process.exit(128 + 2);
});

process.on("SIGTERM", () => {
  console.warn("[Bugsounet] [DB] Closed (SIGTERM)");
  process.exit(128 + 15);
});
*/
