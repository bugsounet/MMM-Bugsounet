"use strict";

const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const uuid = require("uuid");

var db = null;
var log = () => { /* do nothing */ };
const userRows = "id, disabled, username, newPassword, level, avatar, language, background, topbar";

function initUptimed () {
  var query = `
    CREATE TABLE IF NOT EXISTS "uptimed" (
      "system" INTEGER NOT NULL,
      "magicmirror" INTEGER NOT NULL
    )
  `;
  db.exec(query);

  const row = db.prepare("SELECT * FROM uptimed").get();
  if (!row) {
    db.exec("INSERT INTO uptimed (system, magicmirror) VALUES (0, 0)");
    console.debug("[Bugsounet] [DB] Uptimed database created");
  }
}

function initLogin () {
  var query = `
    CREATE TABLE IF NOT EXISTS "login" (
      "language" TEXT NOT NULL,
      "background" INTEGER NOT NULL
    )
  `;
  db.exec(query);

  const row = db.prepare("SELECT * FROM login").get();
  if (!row) {
    db.exec("INSERT INTO login (language, background) VALUES ('en', 2)");
    console.debug("[Bugsounet] [DB] login database created");
  }
}

function initUsers () {
  var query = `
    CREATE TABLE IF NOT EXISTS "users" (
      "id" TEXT NOT NULL UNIQUE,
      "disabled" BOOLEAN DEFAULT 0,
      "username" TEXT NOT NULL UNIQUE,
      "password" TEXT NOT NULL,
      "newPassword" BOOLEAN DEFAULT 0,
      "level" INTEGER NOT NULL DEFAULT 1,
      "avatar" INTEGER NOT NULL DEFAULT 1,
      "language" TEXT NOT NULL DEFAULT 'en',
      "background" INTEGER NOT NULL DEFAULT 2,
      "topbar" INTEGER NOT NULL DEFAULT 26
    )
  `;
  db.exec(query);

  const row = db.prepare("SELECT * FROM users WHERE level = 5").get();
  if (!row) {
    const newUser = {
      id: uuid.v4(),
      username: "admin",
      password: cryptPassword("admin", 10),
      newPassword: 1,
      level: 5,
      disabled: 1
    };
    const insert = db.prepare("INSERT INTO users (id, username, password, newPassword, level, disabled) VALUES (@id, @username, @password, @newPassword, @level, @disabled)");

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

function updateDatas (database, key, value) {
  if (!db) return console.error("[Bugsounet] [DB] Not initialized");
  const update = db.prepare(`UPDATE ${database} SET ${key} = ?`);
  update.run(value);
}
module.exports.updateDatas = updateDatas;

function getDatas (database) {
  if (!db) {
    console.error("[Bugsounet] [DB] Not initialized");
    return {};
  }
  const row = db.prepare(`SELECT * FROM ${database}`).get();
  return row;
}
module.exports.getDatas = getDatas;

function getUsers () {
  if (!db) {
    console.error("[Bugsounet] [DB] Not initialized");
    return [];
  }
  const row = db.prepare(`SELECT ${userRows} FROM users`).all();
  return row;
}
module.exports.getUsers = getUsers;

function getUserById (id) {
  if (!db) {
    console.error("[Bugsounet] [DB] Not initialized");
    return {};
  }
  const row = db.prepare(`SELECT * FROM users WHERE id = '${id}'`).get();
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

function getUserByUsernameExceptPassword (username) {
  if (!db) {
    console.error("[Bugsounet] [DB] Not initialized");
    return {};
  }
  const row = db.prepare(`SELECT ${userRows} FROM users WHERE username = '${username}'`).get();
  return row;
}
module.exports.getUserByUsernameExceptPassword = getUserByUsernameExceptPassword;

function getUserIdByUsername (username) {
  if (!db) {
    console.error("[Bugsounet] [DB] Not initialized");
    return {};
  }
  const row = db.prepare(`SELECT id FROM users WHERE username = '${username}'`).get();
  return row?.id;
}
module.exports.getUserIdByUsername = getUserIdByUsername;

function updateUserById (id, key, value) {
  if (!db) {
    console.error("[Bugsounet] [DB] Not initialized");
    return {};
  }
  const update = db.prepare(`UPDATE users SET ${key} = ? WHERE id = '${id}'`);
  update.run(value);
}
module.exports.updateUserById = updateUserById;

function getMyAdmin () {
  if (!db) {
    console.error("[Bugsounet] [DB] Not initialized");
    return {};
  }
  const row = db.prepare("SELECT * FROM users WHERE level = 5").get();
  return row;
}
module.exports.getMyAdmin = getMyAdmin;

function addUser (user) {
  const newUser = {
    id: uuid.v4(),
    username: user.username,
    password: cryptPassword(user.password, 10),
    newPassword: 1,
    level: user.level,
    disabled: user.disabled ? 1 : 0,
    avatar: user.avatar,
    background: user.background,
    topbar: user.topbar
  };
  const insert = db.prepare("INSERT INTO users (id, username, password, newPassword, level, disabled, avatar, background, topbar) VALUES (@id, @username, @password, @newPassword, @level, @disabled, @avatar, @background, @topbar)");
  insert.run(newUser);
}
module.exports.addUser = addUser;

function deleteUserById (id) {
  const deleteUser = db.prepare(`DELETE FROM users WHERE id = '${id}'`);
  deleteUser.run();
}
module.exports.deleteUserById = deleteUserById;

function cryptPassword (password) {
  return bcrypt.hashSync(password, 10);
}
