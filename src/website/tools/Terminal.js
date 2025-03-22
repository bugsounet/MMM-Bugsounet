/** Terminal
* @bugsounet
**/

/* global setTranslation, getVersion, loadTranslation, forceMobileRotate, doTranslateNavBar, io, Terminal, FitAddon */

// rotate rules
/* eslint-disable-next-line */
var PleaseRotateOptions = {
  startOnPageLoad: false
};

// define all vars
var translation = {};
var version = {};

// Load rules
window.addEventListener("load", async () => {
  version = await getVersion();
  translation = await loadTranslation();

  forceMobileRotate();
  switch (window.location.pathname) {
    case "/Terminal":
      doTerminalLogs();
      break;
    case "/ptyProcess":
      doTerminal();
      break;
  }

  doTranslateNavBar();
});

async function doTerminalLogs () {
  document.title = translation.Terminal;
  setTranslation("TerminalHeader", translation.Terminal);
  setTranslation("openTerminal", translation.TerminalOpen);
  var socketLogs = io();
  const termLogs = new Terminal({ cursorBlink: true });
  const fitAddonLogs = new FitAddon.FitAddon();
  termLogs.loadAddon(fitAddonLogs);
  termLogs.open(document.getElementById("terminal"));
  fitAddonLogs.fit();

  window.addEventListener("resize", function () {
    fitAddonLogs.fit();
  });

  socketLogs.on("connect", () => {
    termLogs.write(`\x1B[1;3;31mMMM-Bugsounet v${version.version} (${version.rev}.${version.lang})\x1B[0m \r\n\n`);
  });

  socketLogs.on("disconnect", () => {
    termLogs.write("\r\n\n\x1B[1;3;31mDisconnected\x1B[0m\r\n");
  });

  socketLogs.on("terminal.logs", function (data) {
    termLogs.write(data);
  });

  socketLogs.io.on("error", (data) => {
    console.log("Socket Error:", data);
    socketLogs.close();
  });
}

async function doTerminal () {
  document.title = translation.Terminal;
  setTranslation("PTYHeader", translation.TerminalGW);
  var socketPTY = io();
  const termPTY = new Terminal({ cursorBlink: true });
  const fitAddonPTY = new FitAddon.FitAddon();
  termPTY.loadAddon(fitAddonPTY);
  termPTY.open(document.getElementById("terminal"));
  fitAddonPTY.fit();

  window.addEventListener("resize", function () {
    fitAddonPTY.fit();
    if (termPTY.rows && termPTY.cols) {
      socketPTY.emit("terminal.size", { cols: termPTY.cols, rows: termPTY.rows });
    }
  });

  if (termPTY.rows && termPTY.cols) {
    socketPTY.emit("terminal.size", { cols: termPTY.cols, rows: termPTY.rows });
  }

  socketPTY.on("connect", () => {
    termPTY.write(`\x1B[1;3;31mMMM-Bugsounet v${version.version} (${version.rev}.${version.lang})\x1B[0m \r\n\n`);
  });

  socketPTY.on("disconnect", () => {
    termPTY.write("\r\n\n\x1B[1;3;31mDisconnected\x1B[0m\r\n");
  });

  termPTY.onData((data) => {
    socketPTY.emit("terminal.toTerm", data);
  });

  socketPTY.on("terminal.incData", function (data) {
    termPTY.write(data);
  });

  socketPTY.io.on("error", (data) => {
    console.log("Socket Error:", data);
    socketPTY.close();
  });
}
