/* global DoToast setTranslation getTranslate getEXTVersions
  checkSystem io Terminal FitAddon getVersion getHomeText applyNavbarTheme
  getMyUser loadLoginTranslation saveAs JSONEditor loadMMConfig loadBackupConfig loadBackupNames
  bootstrap getTranslateGroup checkEXTStatus doUpdates doDie doRestart doShutdown doReboot HideBlock ShowBlock
  deleteBackups hasPluginConnected doStop loadRadio putRadio putSpeaker putMic loadFreeboxTV putTV doAlert
  doAssistantQuery doScreenPower doLogin showAlert putMyUser SpotifyPrevious SpotifyStop SpotifyPlay SpotifyNext SpotifySend
  loadBackup saveBackup readBackup writeConfig Swal doYouTubeQuery getLoginPrefs putLoginPrefs
  UpdateFlagsLanguage FlagsSelector applyBackgroundTheme AdminSaveChange AdminDelete getAllUsers
  UserSelector LevelSelector checkPasswordStrength putNewUser loadContentDynamically deleteUser updateUser
 */

/* eslint-disable max-lines-per-function */

var interval = null;
var timerTerminalResize = null;
var socket = null;
var user = {};
const contentWrapper = document.querySelector(".content-wrapper");

document.addEventListener("Includes_Complete", doIndex);
document.addEventListener("NewContent_Loaded", doLoaded);

async function doIndex () {
  console.log("Execute index.js - doIndex");

  await do404Page();
  await doLoginPage();
  await doSidebar();
  await doHomePage();
  doPassword();
}

async function doLoaded () {
  console.log("Execute index.js - doLoaded");
  AddContainerLoader();
  if (interval) {
    clearInterval(interval);
    interval = null;
    console.log("interval checker canceled");
  }

  if (socket) {
    socket.close();
    socket = null;
    console.log("socket closed");
  }

  if (document.body.onresize) {
    document.body.onresize = null;
    clearTimeout(timerTerminalResize);
    timerTerminalResize = null;
    console.log("check body resize canceled");
  }

  await doHomePage();
  await doConfigPage();
  await doEditConfigPage();
  await doLogsPage();
  await doSSHPage();
  await doToolsPage();
  await doSystemPage();
  await doPartyPage();
  await doAPIPage();
  await doAboutPage();
  await doIframe();
  await doAccountPage();
  await doAdminPage();

  // enable tooltip
  var tooltipTriggerList = [].slice.call(document.querySelectorAll("[data-bs-toggle='tooltip']"));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl, { container: tooltipTriggerEl });
  });

  // enable password checker
  doPassword();
}

/** all functions **/
function removeLoader () {
  const spinner = document.getElementById("spinner");
  const contentContainer = document.querySelector(".content-container");
  const loadingBar = document.getElementById("loading-bar");
  const containerLoader = document.getElementById("containerLoader");
  if (spinner) spinner.classList.remove("show");
  if (containerLoader) containerLoader.classList.remove("show");

  if (contentContainer && contentContainer.classList.contains("is-loading")) {
    loadingBar.style.width = "100%";
    loadingBar.classList.add("is-complete");

    // Remove classes after a short delay to allow animations to complete
    setTimeout(() => {
      loadingBar.classList.remove("is-active");
      loadingBar.classList.remove("is-complete");
      loadingBar.style.width = "0%";
    }, 300);
    contentContainer.classList.remove("is-loading");
  }
}

function AddSpinner () {
  const spinner = document.getElementById("spinner");
  spinner.classList.add("show");
}

function AddContainerLoader () {
  const containerLoader = document.getElementById("containerLoader");
  containerLoader.classList.add("show");
}

function doPassword () {
  let password = document.getElementById("password");
  let newpassword = document.getElementById("newpassword");
  let PasswordStrengthChecker = document.getElementById("PasswordStrengthChecker");

  if (password) {
    console.log("detected password");
    let eyeIcon = document.getElementsByClassName("toggle-password");
    Array.from(eyeIcon).forEach((icon) => {
      icon.onclick = function () {
        let textZone = this.parentNode.parentNode.children[1].id;
        let Zone = document.getElementById(textZone);
        if (Zone.type === "password") {
          Zone.type = "text";
          icon.classList.remove("icon-eye");
          icon.classList.add("icon-lock");
        } else {
          Zone.type = "password";
          icon.classList.remove("icon-lock");
          icon.classList.add("icon-eye");
        }
      };
    });

    if (PasswordStrengthChecker) {
      password.onkeyup = () => {
        let pwdChecker = checkPasswordStrength.passwordStrength(password.value);
        let LengthGrp = document.getElementById("LengthGrp");

        if (pwdChecker.length === 0 && pwdChecker.value === "Too weak") password.setAttribute("passwordStrength", "");
        else password.setAttribute("passwordStrength", pwdChecker.value);

        PasswordStrengthChecker.setAttribute("data-Strength-check", pwdChecker.contains.toString());

        if (pwdChecker.length >= 10) LengthGrp.classList.add("LengthGrp");
        else LengthGrp.classList.remove("LengthGrp");
      };

      password.onchange = () => {
        if (password.value || password.value !== "") {
          if (newpassword) newpassword.disabled = false;
        } else {
          password.setAttribute("passwordStrength", "");
          PasswordStrengthChecker.setAttribute("data-Strength-check", "");
          if (newpassword) {
            newpassword.disabled = true;
            newpassword.value = "";
          }
        }
      };
    }
  }
}

async function doLoginPage () {
  // login page
  let loginPage = document.getElementById("login-html");
  if (loginPage) {
    console.log("detected login page");
    const loginTranslations = await loadLoginTranslation();
    const loginPrefs = await getLoginPrefs();

    // background theme
    if ((loginPrefs.background >= 1 && loginPrefs.background <= 15)) {
      document.querySelector("body").className = `bg-theme bg-theme${loginPrefs.background}`;
    }

    document.getElementById("username").setAttribute("placeholder", loginTranslations["Username"]);
    document.getElementById("password").setAttribute("placeholder", loginTranslations["Password"]);
    setTranslation("login-submit", loginTranslations["Login"]);

    const button = document.getElementById("login");
    button.addEventListener("submit", function () {
      event.preventDefault();
      let credentials = `${document.getElementById("username").value}:${document.getElementById("password").value}`;
      let encodedCredentials = btoa(credentials);
      doLogin(encodedCredentials, (response) => {
        localStorage.setItem("MMM-Bugsounet", JSON.stringify(response.session));
        location.href = "/";
      }, (err) => {
        document.getElementById("username").value = "";
        document.getElementById("password").value = "";
        if (!err.status || err.status === 500 || err.status === 502) showAlert("No response from MMM-Bugsounet");
        else if (err.status === 403) {
          DoToast("error", `Error ${err.status}`, "Login", loginTranslations["Error"]);
        } else {
          DoToast("error", `Error ${err.status}`, "API Server", err.body);
        }
      });
    });
    removeLoader();
  }
}

async function doSidebar () {
  // sidebar and navbar
  let SideNavBar = document.getElementById("sidebar-wrapper");
  if (SideNavBar) {
    console.log("detected SideNavBar");
    user = await getMyUser();
    const MenuTranslations = await getTranslateGroup(user.language, "Menu_");
    console.warn("User:", user);

    if (user.warn) {
      const contentWrapper = document.querySelector(".content-wrapper");
      Swal.fire({
        title: "Please change your password",
        text: "To enhance your account's security, we recommend changing your current password to a more secure one.",
        imageUrl: "/assets/images/gallery/secure.png",
        didOpen: () => {
          contentWrapper.classList.add("blur");
        },
        willClose: () => {
          contentWrapper.classList.remove("blur");
        },
        showConfirmButton: true,
        confirmButtonText: "Change now",
        showCancelButton: true,
        cancelButtonText: "Change later",
        theme: "dark",
        customClass: {
          confirmButton: "btn btn-primary btn-round me-3",
          cancelButton: "btn btn-dark btn-round"
        }
      }).then((result) => {
        if (result.isConfirmed) {
          document.querySelector("a[data-loading='/html/account.html']").click();
        }
      });
    }

    // background theme
    if ((user.background >= 1 && user.background <= 15)) {
      document.querySelector("body").className = `bg-theme bg-theme${user.background}`;
    }
    // topbar theme
    if (user.topbar >= 20 && user.topbar <= 26) {
      applyNavbarTheme(`bg-theme${user.topbar}`);
    }

    // translations
    setTranslation("myusername", user.username);
    if (user.level === 10) setTranslation("mylevel", MenuTranslations["Administrator"]);
    else setTranslation("mylevel", await getTranslate(user.language, "Account_Level", { level: user.level }));
    if (user.avatar) {
      let Avatar = document.getElementById("Avatar");
      if (user.avatar) Avatar.src = `/assets/images/avatars/avatar${user.avatar}.png`;
    }
    setTranslation("Account", MenuTranslations["Account"]);
    setTranslation("Logout", MenuTranslations["Logout"]);

    setTranslation("Home", MenuTranslations["Home"]);
    setTranslation("Dashboard", MenuTranslations["Dashboard"]);
    setTranslation("MMConfig", MenuTranslations["Config"]);
    setTranslation("MMView", MenuTranslations["ConfigView"]);
    setTranslation("MMEdit", MenuTranslations["ConfigEdit"]);
    setTranslation("Terminal", MenuTranslations["Terminal"]);
    setTranslation("TerminalLogs", MenuTranslations["TerminalLogs"]);
    setTranslation("TerminalSSH", MenuTranslations["TerminalSSH"]);
    setTranslation("Tools", MenuTranslations["Tools"]);
    setTranslation("System", MenuTranslations["System"]);
    setTranslation("3rdPartyModules", MenuTranslations["3rdPartyModules"]);
    setTranslation("API", MenuTranslations["API"]);
    setTranslation("About", MenuTranslations["About"]);
  }
}

async function doHomePage () {
  // Home page
  let homePage = document.getElementById("home-html");
  if (homePage) {
    console.log("detected Home page");
    setTranslation("welcome", await getTranslate(user.language, "Home_Welcome"));
    document.getElementById("HomeText").innerHTML = await getHomeText(user.language);
    removeLoader();
  }
}

function doIframe () {
  const iframeChild = document.querySelector("iframe");
  const containerFluid = document.querySelector(".container-fluid");
  if (iframeChild) {
    console.log("detected iframe");
    contentWrapper.classList.add("has-iframe");
    containerFluid.classList.add("m-0", "p-0");
  } else {
    contentWrapper?.classList.remove("has-iframe");
    containerFluid?.classList.remove("m-0", "p-0");
  }
}

async function doAccountPage () {
  // account page
  let accountPage = document.getElementById("account-html");
  if (accountPage) {
    console.log("detected Account page");
    const AccountTranslations = await getTranslateGroup(user.language, "Account_");
    // translation
    setTranslation("Profile", AccountTranslations["Profile"]);
    setTranslation("Background", AccountTranslations["Background"]);
    setTranslation("Navbar", AccountTranslations["Navbar"]);

    setTranslation("UserProfile", AccountTranslations["UserProfile"]);
    setTranslation("UsernameProfile", AccountTranslations["UsernameProfile"]);
    setTranslation("LevelProfile", AccountTranslations["LevelProfile"]);
    setTranslation("AvatarProfile", AccountTranslations["AvatarProfile"]);
    setTranslation("ChangePassword", AccountTranslations["ChangePassword"]);
    setTranslation("PasswordProfile", AccountTranslations["PasswordProfile"]);
    setTranslation("NewPasswordProfile", AccountTranslations["NewPasswordProfile"]);

    setTranslation("BackgroundProfile", AccountTranslations["BackgroundTheme"]);
    setTranslation("NavbarProfile", AccountTranslations["NavbarTheme"]);

    document.getElementById("password").setAttribute("placeholder", AccountTranslations["NewPassword"]);
    document.getElementById("newpassword").setAttribute("placeholder", AccountTranslations["NewPasswordConfim"]);

    document.getElementById("SaveChange").value = AccountTranslations["SaveChange"];
    document.getElementById("username").value = user.username;
    if (user.level === 10) document.getElementById("LevelUser").value = AccountTranslations["Administrator"];
    else document.getElementById("LevelUser").value = user.level;

    const avatarInput = document.querySelector(`input[name="avatar"][value="${user.avatar}"]`);
    if (avatarInput) avatarInput.checked = true;

    await UpdateFlagsLanguage(user);
    FlagsSelector(user);

    let newpassword = document.getElementById("newpassword");
    newpassword.value = "";
    newpassword.disabled = true;
    let password = document.getElementById("password");
    password.addEventListener("change", function () {
      if (password.value !== "") {
        newpassword.disabled = false;
      } else {
        newpassword.disabled = true;
        newpassword.value = "";
      }
    });

    document.getElementById("theme1").onclick = () => applyBackgroundTheme("bg-theme1");
    document.getElementById("theme2").onclick = () => applyBackgroundTheme("bg-theme2");
    document.getElementById("theme3").onclick = () => applyBackgroundTheme("bg-theme3");
    document.getElementById("theme4").onclick = () => applyBackgroundTheme("bg-theme4");
    document.getElementById("theme5").onclick = () => applyBackgroundTheme("bg-theme5");
    document.getElementById("theme6").onclick = () => applyBackgroundTheme("bg-theme6");
    document.getElementById("theme7").onclick = () => applyBackgroundTheme("bg-theme7");
    document.getElementById("theme8").onclick = () => applyBackgroundTheme("bg-theme8");
    document.getElementById("theme9").onclick = () => applyBackgroundTheme("bg-theme9");
    document.getElementById("theme10").onclick = () => applyBackgroundTheme("bg-theme10");
    document.getElementById("theme11").onclick = () => applyBackgroundTheme("bg-theme11");
    document.getElementById("theme12").onclick = () => applyBackgroundTheme("bg-theme12");
    document.getElementById("theme13").onclick = () => applyBackgroundTheme("bg-theme13");
    document.getElementById("theme14").onclick = () => applyBackgroundTheme("bg-theme14");
    document.getElementById("theme15").onclick = () => applyBackgroundTheme("bg-theme15");

    document.getElementById("theme20").onclick = () => applyNavbarTheme("bg-theme20");
    document.getElementById("theme21").onclick = () => applyNavbarTheme("bg-theme21");
    document.getElementById("theme22").onclick = () => applyNavbarTheme("bg-theme22");
    document.getElementById("theme23").onclick = () => applyNavbarTheme("bg-theme23");
    document.getElementById("theme24").onclick = () => applyNavbarTheme("bg-theme24");
    document.getElementById("theme25").onclick = () => applyNavbarTheme("bg-theme25");
    document.getElementById("theme26").onclick = () => applyNavbarTheme("bg-theme26");

    const backgroundInput = document.querySelector(`input[name="background"][value="${user.background}"]`);
    if (backgroundInput) backgroundInput.checked = true;

    const navbarInput = document.querySelector(`input[name="navbar"][value="${user.topbar}"]`);
    if (navbarInput) navbarInput.checked = true;

    // save change
    const accountButton = document.getElementById("SaveChange");
    accountButton.onclick = function () {
      AddSpinner();
      const NewUsername = document.getElementById("username").value;
      const NewPassword = document.getElementById("password").value;
      const NewPasswordConfirm = document.getElementById("newpassword").value;
      const selectedLanguageInput = document.getElementById("selectedLanguage").value;

      let MyUser = {
        id: user.id
      };

      const selectedAvatarInput = document.querySelector("input[name='avatar']:checked");
      let selectedAvatarValue = null;
      if (selectedAvatarInput) {
        selectedAvatarValue = parseInt(selectedAvatarInput.value);
        if (selectedAvatarValue !== user.avatar) MyUser.avatar = selectedAvatarValue;
      }

      if (NewUsername !== user.username) MyUser.username = NewUsername;

      if (selectedLanguageInput !== user.language) MyUser.language = selectedLanguageInput;

      if (NewPassword !== "") {
        if (NewPassword !== NewPasswordConfirm) {
          DoToast("error", AccountTranslations["Account"], user.username, "Password don't match");
        } else {
          if (password.getAttribute("passwordstrength") !== "Strong") {
            DoToast("error", AccountTranslations["Account"], user.username, "Password must be Strong");
          }
          else MyUser.password = btoa(NewPassword);
        }
      }

      const selectedBackgroundInput = document.querySelector("input[name='background']:checked");
      const selectedNavbarInput = document.querySelector("input[name='navbar']:checked");
      let selectedBackgroundValue = null;
      if (selectedBackgroundInput) {
        selectedBackgroundValue = parseInt(selectedBackgroundInput.value);
        if (selectedBackgroundValue !== user.background) MyUser.background = selectedBackgroundValue;
      }

      let selectedNavbarValue = null;
      if (selectedNavbarInput) {
        selectedNavbarValue = parseInt(selectedNavbarInput.value);
        if (selectedNavbarValue !== user.topbar) MyUser.topbar = selectedNavbarValue;
      }

      let MyUserSize = Object.keys(MyUser).length;
      if (MyUserSize > 1) {
        putMyUser(MyUser, async () => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          await doSidebar();
          await doAccountPage();
          removeLoader();
        });
      } else {
        DoToast("warning", AccountTranslations["Account"], user.username, "Sorry, there is no change to save");
        removeLoader();
      }
    };

    removeLoader();
  }
}

async function doLogsPage () {
  // logs page
  let logsPage = document.getElementById("logs-html");
  if (logsPage) {
    console.log("detected logs page");
    const version = await getVersion();
    // var timerLogsResize = null;
    let terminalTitle = document.getElementById("terminalTitle");
    terminalTitle.textContent = await getTranslate(user.language, "Terminal_Logs");
    socket = io();
    const termLogs = new Terminal({ cursorBlink: true });
    const fitAddonLogs = new FitAddon.FitAddon();
    termLogs.loadAddon(fitAddonLogs);
    termLogs.open(document.getElementById("terminal"));
    fitAddonLogs.fit();

    document.body.onresize = () => {
      clearTimeout(timerTerminalResize);
      timerTerminalResize = setTimeout(() => {
        fitAddonLogs.fit();
      }, 300);
    };

    socket.on("connect", () => {
      termLogs.write(`\x1B[1;3;31mMMM-Bugsounet v${version.version} (${version.rev}.${user.language})\x1B[0m \r\n\n`);
    });

    socket.on("disconnect", () => {
      termLogs.write("\r\n\n\x1B[1;3;31mDisconnected\x1B[0m\r\n");
    });

    socket.on("terminal.logs", function (data) {
      termLogs.write(data);
    });

    socket.io.on("error", (data) => {
      console.error("Socket Error:", data);
      socket.close();
    });
    removeLoader();
  }
}

async function doSSHPage () {
  let SSHPage = document.getElementById("SSH-html");
  if (SSHPage) {
    console.log("detected SSH page");
    const version = await getVersion();
    let terminalTitle = document.getElementById("terminalTitle");
    terminalTitle.textContent = await getTranslate(user.language, "Terminal_SSH");

    socket = io();
    const termPTY = new Terminal({ cursorBlink: true });
    const fitAddonPTY = new FitAddon.FitAddon();
    termPTY.loadAddon(fitAddonPTY);
    termPTY.open(document.getElementById("terminal"));
    fitAddonPTY.fit();

    document.body.onresize = () => {
      clearTimeout(timerTerminalResize);
      timerTerminalResize = setTimeout(() => {
        fitAddonPTY.fit();
        if (termPTY.rows && termPTY.cols) {
          socket.emit("terminal.size", { cols: termPTY.cols, rows: termPTY.rows });
        }
      }, 300);
    };

    if (termPTY.rows && termPTY.cols) {
      socket.emit("terminal.size", { cols: termPTY.cols, rows: termPTY.rows });
    }

    socket.on("connect", () => {
      termPTY.write(`\x1B[1;3;31mMMM-Bugsounet v${version.version} (${version.rev}.${user.language})\x1B[0m \r\n\n`);
    });

    socket.on("disconnect", () => {
      termPTY.write("\r\n\n\x1B[1;3;31mDisconnected\x1B[0m\r\n");
    });

    termPTY.onData((data) => {
      socket.emit("terminal.toTerm", data);
    });

    socket.on("terminal.incData", function (data) {
      termPTY.write(data);
    });

    socket.io.on("error", (data) => {
      console.error("Socket Error:", data);
      socket.close();
    });
    removeLoader();
  }
}

async function doSystemPage () {
  // system page
  let systemPage = document.getElementById("system-html");
  if (systemPage) {
    console.log("detected system page");
    var SystemFirstScan = true;
    var EXTVersions = {};
    var system = {};

    const SystemTranslations = await getTranslateGroup(user.language, "System_");

    system = await checkSystem();
    do_System(() => {
      do_SystemStatic();
    });

    interval = setInterval(async () => {
      system = await checkSystem();
      do_System();
    }, 8000);

    async function do_SystemStatic () {
      // Display static values
      setTranslation("HOSTNAME", system.HOSTNAME);

      setTranslation("VersionSystem", SystemTranslations["Box_Version"]);
      setTranslation("NodeVersion", SystemTranslations["NodeVersion"]);
      setTranslation("NPMVersion", SystemTranslations["NPMVersion"]);
      setTranslation("OSVersion", SystemTranslations["OSVersion"]);
      setTranslation("KernelVersion", SystemTranslations["KernelVersion"]);

      setTranslation("MMVersion", system.VERSION.MagicMirror);
      setTranslation("ElectronVersion", system.VERSION.ELECTRON);
      setTranslation("NODECORE", system.VERSION.NODECORE);
      setTranslation("NPM", system.VERSION.NPM);
      setTranslation("OS", system.VERSION.OS);
      setTranslation("KERNEL", system.VERSION.KERNEL);

      setTranslation("NamePlugin", SystemTranslations["NamePlugin"]);
      setTranslation("VersionPlugin", SystemTranslations["VersionPlugin"]);
      setTranslation("RevPlugin", SystemTranslations["RevPlugin"]);
      if (Object.entries(EXTVersions).length) setTranslation("CurrentlyRunning", SystemTranslations["CurrentlyRunning"]);
      else setTranslation("CurrentlyRunning", SystemTranslations["NoPlugins"]);

      setTranslation("CPUSystem", SystemTranslations["CPUSystem"]);
      setTranslation("TypeCPU", SystemTranslations["TypeCPU"]);
      setTranslation("SpeedCPU", SystemTranslations["SpeedCPU"]);
      setTranslation("CurrentLoadCPU", SystemTranslations["CurrentLoadCPU"]);
      setTranslation("GovernorCPU", SystemTranslations["GovernorCPU"]);
      setTranslation("TempCPU", SystemTranslations["TempCPU"]);

      setTranslation("CPU", system.CPU.type);

      if (system.GPU) {
        setTranslation("GPU", SystemTranslations["GPUAcceleration_Enabled"]);
        const GPUAlert = document.getElementById("GPUAlert");
        const GPUWarn = document.getElementById("GPUWarn");
        GPUWarn.classList.add("visually-hidden");
        GPUAlert.classList.add("bg-google-green");
        GPUAlert.classList.remove("bg-google-red");
      } else {
        setTranslation("GPU", SystemTranslations["GPUAcceleration_Disabled"]);
      }

      setTranslation("MemorySystem", SystemTranslations["MemorySystem"]);
      setTranslation("TypeMemory", SystemTranslations["TypeMemory"]);
      setTranslation("SwapMemory", SystemTranslations["SwapMemory"]);

      setTranslation("NetworkSystem", SystemTranslations["NetworkSystem"]);
      setTranslation("IPNetwork", SystemTranslations["IPNetwork"]);
      setTranslation("InterfaceNetwork", SystemTranslations["InterfaceNetwork"]);
      setTranslation("SpeedNetwork", SystemTranslations["SpeedNetwork"]);
      setTranslation("DuplexNetwork", SystemTranslations["DuplexNetwork"]);
      setTranslation("WirelessInfo", SystemTranslations["WirelessInfo"]);
      setTranslation("SSIDNetwork", SystemTranslations["SSIDNetwork"]);
      setTranslation("FrequencyNetwork", SystemTranslations["FrequencyNetwork"]);
      setTranslation("SignalNetwork", SystemTranslations["SignalNetwork"]);
      setTranslation("RateNetwork", SystemTranslations["RateNetwork"]);
      setTranslation("QualityNetwork", SystemTranslations["QualityNetwork"]);

      setTranslation("StorageSystem", SystemTranslations["StorageSystem"]);
      setTranslation("MountStorage", SystemTranslations["MountStorage"]);
      setTranslation("UsedStorage", SystemTranslations["UsedStorage"]);
      setTranslation("PercentStorage", SystemTranslations["PercentStorage"]);
      setTranslation("TotalStorage", SystemTranslations["TotalStorage"]);

      setTranslation("UptimeSystem", SystemTranslations["UptimeSystem"]);
      setTranslation("CurrentUptime", SystemTranslations["CurrentUptime"]);
      setTranslation("SysCurrent", SystemTranslations["System"]);
      setTranslation("RecordUptime", SystemTranslations["RecordUptime"]);
      setTranslation("SysRecord", SystemTranslations["System"]);

      document.getElementById("SystemDisplayer").classList.remove("visually-hidden");
      removeLoader();
    }

    async function do_System (cb = null) {
      EXTVersions = await getEXTVersions();

      progressOrText(system);
      window.addEventListener("resize", function () {
        let checkSystemPage = document.getElementById("system-html");
        if (checkSystemPage) progressOrText(system);
      });

      //CPU
      setTranslation("SPEED", system.CPU.speed);
      setTranslation("GOVERNOR", system.CPU.governor);

      setTranslation("TempText", `${system.CPU.temp.imperial ? system.CPU.temp.F : system.CPU.temp.C}°`);

      const TempDisplay = document.getElementById("TempDisplay");
      const TempText = document.getElementById("TempText");

      const LoadDisplay = document.getElementById("LoadDisplay");
      const LoadText = document.getElementById("LoadText");

      const MemoryDisplay = document.getElementById("MemoryDisplay");
      const MemoryText = document.getElementById("MemoryText");

      const SwapDisplay = document.getElementById("SwapDisplay");
      const SwapText = document.getElementById("SwapText");

      if (system.CPU.temp.C <= 50) {
        TempDisplay.classList.remove("bg-google-yellow");
        LoadDisplay.classList.remove("bg-google-red");
        TempDisplay.classList.add("bg-google-green");

        TempText.classList.remove("text-google-yellow");
        TempText.classList.remove("text-google-red");
        TempText.classList.add("text-google-green");
      } else if (system.CPU.temp.C > 50 && system.CPU.temp.C <= 80) {
        TempDisplay.classList.remove("bg-google-green");
        TempDisplay.classList.remove("bg-google-red");
        TempDisplay.classList.add("bg-google-yellow");

        TempText.classList.remove("text-google-green");
        TempText.classList.remove("text-google-red");
        TempText.classList.add("text-google-yellow");
      } else if (system.CPU.temp.C > 80) {
        TempDisplay.classList.remove("bg-google-green");
        TempDisplay.classList.remove("bg-google-yellow");
        TempDisplay.classList.add("bg-google-red");

        TempText.classList.remove("text-google-green");
        TempText.classList.remove("text-google-yellow");
        TempText.classList.add("text-google-red");
      }

      setTranslation("MemoryText", system.MEMORY.used);
      setTranslation("MemoryTotal", system.MEMORY.total);
      if (system.MEMORY.percent <= 50) {
        MemoryDisplay.classList.remove("bg-google-yellow");
        MemoryDisplay.classList.remove("bg-google-red");
        MemoryDisplay.classList.add("bg-google-green");

        MemoryText.classList.remove("text-google-yellow");
        MemoryText.classList.remove("text-google-red");
        MemoryText.classList.add("text-google-green");
      } else if (system.MEMORY.percent > 50 && system.MEMORY.percent <= 80) {
        MemoryDisplay.classList.remove("bg-google-green");
        MemoryDisplay.classList.remove("bg-google-red");
        MemoryDisplay.classList.add("bg-google-yellow");

        MemoryText.classList.remove("text-google-green");
        MemoryText.classList.remove("text-google-red");
        MemoryText.classList.add("text-google-yellow");
      } else if (system.MEMORY.percent > 80) {
        MemoryDisplay.classList.remove("bg-google-green");
        MemoryDisplay.classList.remove("bg-google-yellow");
        MemoryDisplay.classList.add("bg-google-red");

        MemoryText.classList.remove("text-google-green");
        MemoryText.classList.remove("text-google-yellow");
        MemoryText.classList.add("text-google-red");
      }

      setTranslation("SwapText", system.MEMORY.swapUsed);
      setTranslation("SwapTotal", system.MEMORY.swapTotal);
      if (system.MEMORY.swapPercent <= 50) {
        SwapDisplay.classList.remove("bg-google-yellow");
        SwapDisplay.classList.remove("bg-google-red");
        SwapDisplay.classList.add("bg-google-green");

        SwapText.classList.remove("text-google-yellow");
        SwapText.classList.remove("text-google-red");
        SwapText.classList.add("text-google-green");
      } else if (system.MEMORY.swapPercent > 50 && system.MEMORY.swapPercent <= 80) {
        SwapDisplay.classList.remove("bg-google-green");
        SwapDisplay.classList.remove("bg-google-red");
        SwapDisplay.classList.add("bg-google-yellow");

        SwapText.classList.remove("text-google-green");
        SwapText.classList.remove("text-google-red");
        SwapText.classList.add("text-google-yellow");
      } else if (system.MEMORY.swapPercent > 80) {
        SwapDisplay.classList.remove("bg-google-green");
        SwapDisplay.classList.remove("bg-google-yellow");
        SwapDisplay.classList.add("bg-google-red");

        SwapText.classList.remove("text-google-green");
        SwapText.classList.remove("text-google-yellow");
        SwapText.classList.add("text-google-red");
      }

      setTranslation("LoadText", `${system.CPU.usage}%`);
      if (system.CPU.usage <= 50) {
        LoadDisplay.classList.remove("bg-google-yellow");
        LoadDisplay.classList.remove("bg-google-red");
        LoadDisplay.classList.add("bg-google-green");

        LoadText.classList.remove("text-google-yellow");
        LoadText.classList.remove("text-google-red");
        LoadText.classList.add("text-google-green");
      } else if (system.CPU.usage > 50 && system.CPU.usage <= 80) {
        LoadDisplay.classList.remove("bg-google-green");
        LoadDisplay.classList.remove("bg-google-red");
        LoadDisplay.classList.add("bg-google-yellow");

        LoadText.classList.remove("text-google-green");
        LoadText.classList.remove("text-google-red");
        LoadText.classList.add("text-google-yellow");
      } else if (system.CPU.usage > 80) {
        LoadDisplay.classList.remove("bg-google-green");
        LoadDisplay.classList.remove("bg-google-yellow");
        LoadDisplay.classList.add("bg-google-red");

        LoadText.classList.remove("text-google-green");
        LoadText.classList.remove("text-google-yellow");
        LoadText.classList.add("text-google-red");
      }

      if (Object.entries(EXTVersions).length) {
        setTranslation("CurrentlyRunning", SystemTranslations["CurrentlyRunning"]);
        document.getElementById("Plugins-Table").classList.remove("visually-hidden");
        Object.entries(EXTVersions).forEach(([key, value]) => {
          if (!document.getElementById(`Plugins-${key}`)?.innerHTML) {
            var plugin = document.createElement("tr");
            plugin.id = `Plugins-${key}`;

            var name = document.createElement("td");
            name.textContent = key;
            if (value.beta) name.classList.add("text-google-yellow");

            var version = document.createElement("td");
            version.textContent = value.version;
            version.className = "text-center";
            if (value.update) {
              version.classList.remove("text-google-green");
              version.classList.add("text-google-red");
            } else {
              version.classList.remove("text-google-red");
              version.classList.add("text-google-green");
            }

            var rev = document.createElement("td");
            rev.textContent = value.rev;
            rev.className = "text-center";

            plugin.appendChild(name);
            plugin.appendChild(version);
            plugin.appendChild(rev);
            document.getElementById("PluginsTable").appendChild(plugin);
          }
        });
      }

      // try to create proper storage
      system.STORAGE.forEach((partition, id) => {
        for (let [name, values] of Object.entries(partition)) {
          if (document.getElementById(`Storage-Part${id}`)?.innerHTML) {
            checkPartColor(id, values.use);
            makeRefresh(values.use, `StorageDisplay${id}`, `StorageUsed${id}`, `${values.use}%`);
            continue;
          }
          var tr = document.createElement("tr");
          tr.id = `Storage-Part${id}`;

          var label = document.createElement("td");
          label.textContent = name;

          var used = document.createElement("td");
          used.textContent = values.used;

          var percent = document.createElement("td");
          percent.style.verticalAlign = "middle";

          var text = document.createElement("div");
          text.id = `StorageText${id}`;
          text.className = "visually-hidden";
          text.textContent = `${values.use}%`;
          percent.appendChild(text);

          var container = document.createElement("div");
          container.id = `Storage${id}`;
          container.className = "flex-fill progress";
          container.style.background = "#212121";
          var progress = document.createElement("div");
          progress.id = `StorageDisplay${id}`;
          progress.className = "progress-bar progress-bar-striped progress-bar-animated bg-google-green";
          checkPartColor(id, values.use);
          container.appendChild(progress);
          var usedValue = document.createElement("span");
          usedValue.id = `StorageUsed${id}`;
          usedValue.className = "text-black fw-bold align-self-end me-1";
          progress.appendChild(usedValue);
          percent.appendChild(container);

          var size = document.createElement("td");
          size.textContent = values.size;

          tr.appendChild(label);
          tr.appendChild(used);
          tr.appendChild(percent);
          tr.appendChild(size);
          document.getElementById("Storage").appendChild(tr);
          checkPartColor(id, values.use);
          makeProgress(values.use, `StorageDisplay${id}`, `StorageUsed${id}`, `${values.use}%`);
        }
      });

      setTranslation("SysUptime", system.UPTIME.currentDHM);
      setTranslation("MMUptime", system.UPTIME.MMDHM);
      setTranslation("SysUptimeRecord", system.UPTIME.recordCurrentDHM);
      setTranslation("MMUptimeRecord", system.UPTIME.recordMMDHM);

      if (SystemFirstScan) {
        makeProgress(system.CPU.temp.C, "TempDisplay", "TempValue", `${system.CPU.temp.imperial ? system.CPU.temp.F : system.CPU.temp.C}°`);
        makeProgress(system.MEMORY.percent, "MemoryDisplay", "MemoryPercent", system.MEMORY.used);
        makeProgress(system.MEMORY.swapPercent, "SwapDisplay", "SwapPercent", system.MEMORY.swapUsed);
        makeProgress(system.CPU.usage, "LoadDisplay", "LoadValue", `${system.CPU.usage}%`);
      } else {
        makeRefresh(system.CPU.temp.C, "TempDisplay", "TempValue", `${system.CPU.temp.imperial ? system.CPU.temp.F : system.CPU.temp.C}°`);
        makeRefresh(system.MEMORY.percent, "MemoryDisplay", "MemoryPercent", system.MEMORY.used);
        makeRefresh(system.MEMORY.swapPercent, "SwapDisplay", "SwapPercent", system.MEMORY.swapUsed);
        makeRefresh(system.CPU.usage, "LoadDisplay", "LoadValue", `${system.CPU.usage}%`);
      }
      SystemFirstScan = false;

      const SpeedArea = document.getElementById("SpeedArea");
      const DuplexArea = document.getElementById("DuplexArea");
      const wiredIcon = document.getElementById("wired-icon");
      const wirelessIcon = document.getElementById("wireless-icon");
      const wirelessSignal = document.getElementById("wirelessSignal");
      const wireless = document.getElementById("wireless");
      const wirelessInfo = document.getElementById("wirelessInfo");

      if (system.NETWORK.type === "wireless") {
        SpeedArea.classList.add("visually-hidden");
        DuplexArea.classList.add("visually-hidden");
        wiredIcon.classList.add("visually-hidden");
        wirelessIcon.classList.remove("visually-hidden");
        wirelessSignal.classList.remove("visually-hidden");
        wireless.classList.remove("signal-0");
        wireless.classList.remove("signal-1");
        wireless.classList.remove("signal-2");
        wireless.classList.remove("signal-3");
        wireless.classList.remove("signal-4");
        wireless.classList.add(`signal-${system.NETWORK.barLevel}`);
        wirelessInfo.classList.remove("visually-hidden");
        setTranslation("ssid", system.NETWORK.ssid);
        setTranslation("rate", system.NETWORK.rate);
        setTranslation("quality", system.NETWORK.quality);
        setTranslation("signalLevel", system.NETWORK.signalLevel);
        setTranslation("frequency", system.NETWORK.frequency);
      } else if (system.NETWORK.type === "wired") {
        SpeedArea.classList.remove("visually-hidden");
        DuplexArea.classList.remove("visually-hidden");
        wirelessSignal.classList.add("visually-hidden");
        wiredIcon.classList.remove("visually-hidden");
        wirelessIcon.classList.add("visually-hidden");
        wirelessInfo.classList.add("visually-hidden");
        setTranslation("speed", system.NETWORK.speed);
        setTranslation("duplex", system.NETWORK.duplex);
      } else {
        SpeedArea.classList.add("visually-hidden");
        DuplexArea.classList.add("visually-hidden");
        wirelessSignal.classList.add("visually-hidden");
        wiredIcon.classList.add("visually-hidden");
        wirelessIcon.classList.add("visually-hidden");
        wirelessInfo.classList.add("visually-hidden");
      }
      setTranslation("IP", system.NETWORK.ip);
      setTranslation("interface", system.NETWORK.name);

      if (cb) cb();
    }

    function progressOrText (system) {
      var vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const Load = document.getElementById("Load");
      const Memory = document.getElementById("Memory");
      const Swap = document.getElementById("Swap");
      const Temp = document.getElementById("Temp");
      const LoadText = document.getElementById("LoadText");
      const MemoryText = document.getElementById("MemoryText");
      const MemoryText2 = document.getElementById("MemoryText2");
      const SwapText = document.getElementById("SwapText");
      const SwapText2 = document.getElementById("SwapText2");
      const TempText = document.getElementById("TempText");

      if (vw < 768) {
        // hide progress
        Load.classList.add("visually-hidden");
        Memory.classList.add("visually-hidden");
        Swap.classList.add("visually-hidden");
        Temp.classList.add("visually-hidden");
        // display Text
        LoadText.classList.remove("visually-hidden");
        MemoryText.classList.remove("visually-hidden");
        MemoryText2.classList.remove("visually-hidden");
        SwapText.classList.remove("visually-hidden");
        SwapText2.classList.remove("visually-hidden");
        TempText.classList.remove("visually-hidden");
        system.STORAGE.forEach((partition, id) => {
          let storageID = document.getElementById(`Storage${id}`);
          let storageText = document.getElementById(`StorageText${id}`);
          if (storageID) storageID.classList.add("visually-hidden");
          if (storageText) storageText.classList.remove("visually-hidden");
        });
      } else {
        // display Progress
        Load.classList.remove("visually-hidden");
        Memory.classList.remove("visually-hidden");
        Swap.classList.remove("visually-hidden");
        Temp.classList.remove("visually-hidden");
        // hide Text
        LoadText.classList.add("visually-hidden");
        MemoryText.classList.add("visually-hidden");
        MemoryText2.classList.add("visually-hidden");
        SwapText.classList.add("visually-hidden");
        SwapText2.classList.add("visually-hidden");
        TempText.classList.add("visually-hidden");
        system.STORAGE.forEach((partition, id) => {
          let storageID = document.getElementById(`Storage${id}`);
          let storageText = document.getElementById(`StorageText${id}`);
          if (storageID) storageID.classList.remove("visually-hidden");
          if (storageText) storageText.classList.add("visually-hidden");
        });
      }
    }

    function checkPartColor (id, value) {
      var vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);

      const Storage = document.getElementById(`Storage${id}`);
      const StorageText = document.getElementById(`StorageText${id}`);
      const StorageDisplay = document.getElementById(`StorageDisplay${id}`);

      if (vw < 768) {
        Storage?.classList.add("visually-hidden");
        StorageText?.classList.remove("visually-hidden");
      } else {
        Storage?.classList.remove("visually-hidden");
        StorageText?.classList.add("visually-hidden");
      }

      if (value <= 50) {
        StorageDisplay?.classList.remove("bg-google-yellow");
        StorageDisplay?.classList.remove("bg-google-red");
        StorageDisplay?.classList.add("bg-google-green");

        StorageText?.classList.remove("text-google-yellow");
        StorageText?.classList.remove("text-google-red");
        StorageText?.classList.add("text-google-green");

      } else if (value > 50 && value <= 80) {
        StorageDisplay?.classList.remove("bg-google-green");
        StorageDisplay?.classList.remove("bg-google-red");
        StorageDisplay?.classList.add("bg-google-yellow");

        StorageText?.classList.remove("text-google-green");
        StorageText?.classList.remove("text-google-red");
        StorageText?.classList.add("text-google-yellow");

      } else if (value > 80) {
        StorageDisplay?.classList.remove("bg-google-green");
        StorageDisplay?.classList.remove("bg-google-yellow");
        StorageDisplay?.classList.add("bg-google-red");

        StorageText?.classList.remove("text-google-green");
        StorageText?.classList.remove("text-google-yellow");
        StorageText?.classList.add("text-google-red");
      }
    }

    function makeProgress (Value, Progress, Text, Display, i = 0) {
      setTranslation(Text, Display);
      var percent = i;
      if (percent <= Value) {
        percent = percent + 1;
        document.getElementById(Progress).style.width = `${percent}%`;
        setTimeout(() => {
          makeProgress(Value, Progress, Text, Display, percent);
        }, 10);
      } else {
        document.getElementById(Progress).style.width = `${Value}%`;
      }
    }

    function makeRefresh (Value, Progress, Text, Display) {
      document.getElementById(Progress).style.width = `${Value}%`;
      setTranslation(Text, Display);
    }
  }
}

async function doAboutPage () {
  // about page
  let aboutPage = document.getElementById("about-html");
  if (aboutPage) {
    console.log("detected about page");
    const AboutTranslations = await getTranslateGroup(user.language, "About_");
    const version = await getVersion();
    setTranslation("version", version.version);
    setTranslation("api", version.api);
    setTranslation("rev", version.rev);

    setTranslation("byHeader", AboutTranslations["by"]);
    setTranslation("DonateHeader", AboutTranslations["Donate"]);
    setTranslation("VersionHeader", AboutTranslations["About"]);
    setTranslation("Translators", AboutTranslations["Translator"]);

    for (let tr = 1; tr <= 10; tr++) {
      let trans = AboutTranslations[`Translator${tr}`];
      if (tr === 1 && trans) document.getElementById("translatorsBox").classList.remove("visually-hidden");
      if (trans) setTranslation(`translator-${tr}`, trans);
      else break;
    }
    removeLoader();
  }
}

async function doAPIPage () {
  // API page
  let APIPage = document.getElementById("API-html");
  if (APIPage) {
    console.log("detected API page");
    removeLoader();
  }
}

async function doPartyPage () {
  // 3rdparty page
  let partyPage = document.getElementById("3rdparty-html");
  if (partyPage) {
    console.log("detected 3rdparty page");
    removeLoader();
  }
}

async function doToolsPage () {
  // tools page
  let toolsPage = document.getElementById("tools-html");
  if (toolsPage) {
    console.log("detected tools page");
    var EXTStatus = await checkEXTStatus();
    console.warn("EXTs Status", EXTStatus);

    const GenericTranslations = await getTranslateGroup(user.language, "Generic_");
    const ToolsTranslations = await getTranslateGroup(user.language, "Tools_");

    setTranslation("ToolsTitle", ToolsTranslations["Title"]);
    setTranslation("ToolsDescription", ToolsTranslations["Description"]);

    let ControlIDs = document.querySelectorAll("[id='Control']");
    ControlIDs.forEach((id) => {
      id.textContent = GenericTranslations["Control"];
    });

    if (EXTStatus["EXT-Updates"].hello) {
      HideBlock("UpdateBlock");
      setTranslation("UpdateHeader", ToolsTranslations["Update_Header"]);
      setTranslation("UpdateApply", GenericTranslations["Update"]);
      document.getElementById("UpdateApply").classList.add("disabled");
      document.getElementById("UpdateApply").onclick = function () {
        document.getElementById("UpdateApply").classList.add("disabled");
        doUpdates(() => {
          DoToast("success", "EXT-Updates", null, GenericTranslations["RequestDone"]);
        });
      };
    } else {
      HideBlock("UpdateBlock");
    }

    // restart / stop MM²
    setTranslation("MMDie", GenericTranslations["Stop"]);
    setTranslation("MMRestart", GenericTranslations["Restart"]);

    document.getElementById("MMDie").onclick = function () {
      DoToast("success", "MagicMirror²", null, ToolsTranslations["MM_Die"]);
      doDie();
    };

    document.getElementById("MMRestart").onclick = function () {
      DoToast("success", "MagicMirror²", null, ToolsTranslations["MM_Restart"]);
      doRestart();
    };

    // reboot shutdown system
    setTranslation("SystemHeader", ToolsTranslations["System_Header"]);
    setTranslation("SysDie", GenericTranslations["Stop"]);
    setTranslation("SysRestart", GenericTranslations["Restart"]);

    document.getElementById("SysDie").onclick = function () {
      DoToast("success", ToolsTranslations["System_Header"], null, ToolsTranslations["System_Die"]);
      doShutdown();
    };

    document.getElementById("SysRestart").onclick = function () {
      DoToast("success", ToolsTranslations["System_Header"], null, ToolsTranslations["System_Restart"]);
      doReboot();
    };

    // backups
    const allBackup = await loadBackupNames();
    if (allBackup.length > 5) {
      setTranslation("BackupDelete", GenericTranslations["Delete"]);
      setTranslation("backupFoundNumber", allBackup.length);
      setTranslation("backupFoundText", ToolsTranslations["Backup_Found"]);
      setTranslation("backupDeleteAll", ToolsTranslations["Backup_DeleteAll"]);

      document.getElementById("BackupDelete").onclick = function () {
        deleteBackups(() => {
          DoToast("success", "MMM-Bugsounet", null, ToolsTranslations["Backup_Deleted"]);
          HideBlock("BackupBlock");
        }, (err) => {
          DoToast("error", `Error ${err.status}`, "deleteBackups", err.body);
        });
      };
    } else {
      HideBlock("BackupBlock");
    }

    setTranslation("StopText", ToolsTranslations["Stop_Text"]);
    setTranslation("StopApply", GenericTranslations["Stop"]);
    if (hasPluginConnected(EXTStatus, "connected", true)) ShowBlock("StopBlock");
    else HideBlock("StopBlock");
    document.getElementById("StopApply").onclick = function () {
      doStop(() => {
        DoToast("success", "MMM-Bugsounet", "Stop", GenericTranslations["RequestDone"]);
        HideBlock("StopBlock");
      });
    };

    setTranslation("AlertText", ToolsTranslations["Alert_Text"]);

    // RadioPlayer query
    if (EXTStatus["EXT-RadioPlayer"].hello) {
      setTranslation("RadioSend", GenericTranslations["Listen"]);
      setTranslation("RadioText", ToolsTranslations["Radio_Text"]);

      var radio = await loadRadio();
      if (radio.length) {
        radio.forEach((station) => {
          let option = document.createElement("option");
          option.classList.add("bg-light");
          option.value = station;
          option.text = station;
          document.getElementById("RadioQuery").appendChild(option);
        });
      }
      else {
        HideBlock("RadioQuery");
        setTranslation("RadioText", ToolsTranslations["Radio_NoFound"]);
        document.getElementById("RadioSend").classList.add("disabled");
      }
      document.getElementById("RadioSend").onclick = function () {
        putRadio(document.getElementById("RadioQuery").value, () => {
          DoToast("success", "EXT-RadioPlayer", null, GenericTranslations["RequestDone"]);
        });
      };
    } else {
      HideBlock("RadioBlock");
    }

    // Volume control
    if (EXTStatus["EXT-Volume"].hello) {
      setTranslation("SpeakerVolumeSend", GenericTranslations["Send"]);
      setTranslation("SpeakerText", ToolsTranslations["Volume_Text"]);
      setTranslation("SpeakerDefine", ToolsTranslations["Volume_Define"]);
      setTranslation("SpeakerActual", ToolsTranslations["Volume_Actual"]);
      setTranslation("SpeakerValue", `${EXTStatus["EXT-Volume"].speaker}%`);

      document.getElementById("SpeakerVolumeSend").onclick = function () {
        putSpeaker(Number(document.getElementById("SpeakerQuery").value), () => {
          DoToast("success", "EXT-Volume", null, GenericTranslations["RequestDone"]);
        });
      };

      // mic control
      setTranslation("MicVolumeSend", GenericTranslations["Send"]);
      setTranslation("MicText", ToolsTranslations["Volume_Text_Record"]);
      setTranslation("MicDefine", ToolsTranslations["Volume_Define"]);
      setTranslation("MicActual", ToolsTranslations["Volume_Actual"]);
      setTranslation("MicValue", `${EXTStatus["EXT-Volume"].recorder}%`);

      document.getElementById("MicVolumeSend").onclick = function () {
        putMic(Number(document.getElementById("MicQuery").value), () => {
          DoToast("success", "EXT-Volume", null, GenericTranslations["RequestDone"]);
        });
      };
    } else {
      HideBlock("SpeakerBlock");
      HideBlock("MicBlock");
    }

    if (EXTStatus["EXT-FreeboxTV"].hello) {
      var freeboxTV = await loadFreeboxTV();
      if (freeboxTV.length) {
        freeboxTV.forEach((TV) => {
          let option = document.createElement("option");
          option.classList.add("bg-light");
          option.value = TV;
          option.text = TV;
          document.getElementById("FreeboxTVQuery").appendChild(option);
        });
      } else {
        document.getElementById("FreeboxTVQuery").style.display = "none";
        document.getElementById("FreeboxTVText").textContent = "Aucune source disponible";
        document.getElementById("FreeboxTVSend").classList.add("disabled");
      }

      document.getElementById("FreeboxTVSend").onclick = function () {
        putTV(document.getElementById("FreeboxTVQuery").value, () => {
          DoToast("success", "EXT-FreeboxTV", null, GenericTranslations["RequestDone"]);
        });
      };
    } else {
      HideBlock("FreeboxTVBlock");
    }

    // Bugsounet-Alert query
    setTranslation("AlertSend", GenericTranslations["Send"]);
    document.getElementById("AlertQuery").setAttribute("placeholder", ToolsTranslations["Alert_Query"]);
    setTranslation("AlertText", ToolsTranslations["Alert_Text"]);

    function SendAlertRequest () {
      document.getElementById("AlertSend").classList.add("disabled");
      doAlert(document.getElementById("AlertQuery").value, () => {
        DoToast("success", "EXT-Alert", null, GenericTranslations["RequestDone"]);
        document.getElementById("AlertQuery").value = "";
      });
    }

    document.getElementById("AlertQuery").addEventListener("keyup", function (e) {
      const AlertSend = document.getElementById("AlertSend");
      if (this.value.length > 5) {
        AlertSend.classList.remove("disabled");
      } else {
        AlertSend.classList.add("disabled");
      }
      if ((e.key === "Enter" || e.keyCode === 13) && !AlertSend.matches(".disabled")) {
        SendAlertRequest();
      }
    });

    document.getElementById("AlertSend").onclick = function () {
      SendAlertRequest();
    };

    if (EXTStatus["EXT-Assistant"].hello) {
      setTranslation("AssistantText", ToolsTranslations["Assistant_Text"]);
      setTranslation("AssistantSend", GenericTranslations["Send"]);
      document.getElementById("AssistantQuery").setAttribute("placeholder", ToolsTranslations["Assistant_Query"]);

      function SendAssistantRequest () {
        document.getElementById("AssistantSend").classList.add("disabled");
        doAssistantQuery(document.getElementById("AssistantQuery").value, () => {
          document.getElementById("AssistantQuery").value = "";
          DoToast("success", "EXT-Assistant", null, GenericTranslations["RequestDone"]);
        });
      }

      document.getElementById("AssistantQuery").addEventListener("keyup", function (e) {
        const AssistantSend = document.getElementById("AssistantSend");
        if (this.value.length > 5) {
          AssistantSend.classList.remove("disabled");
        } else {
          AssistantSend.classList.add("disabled");
        }
        if ((e.key === "Enter" || e.keyCode === 13) && !AssistantSend.matches(".disabled")) {
          SendAssistantRequest();
        }
      });

      document.getElementById("AssistantSend").onclick = function () {
        SendAssistantRequest();
      };
    } else {
      HideBlock("AssistantBlock");
    }

    if (EXTStatus["EXT-Screen"].hello) {
      setTranslation("ScreenText", ToolsTranslations["Screen_Text"]);
      if (EXTStatus["EXT-Screen"].power) {
        setTranslation("ScreenPower", GenericTranslations["TurnOff"]);
      } else {
        setTranslation("ScreenPower", GenericTranslations["TurnOn"]);
      }
      document.getElementById("ScreenPower").onclick = function () {
        let powerControler = EXTStatus["EXT-Screen"].power ? "OFF" : "ON";
        doScreenPower(powerControler, () => {
          DoToast("success", "EXT-Screen", null, GenericTranslations["RequestDone"]);
        });
      };
    } else {
      HideBlock("ScreenBlock");
    }

    // Spotify Control
    if (EXTStatus["EXT-Spotify"].hello) {
      setTranslation("SpotifyText", ToolsTranslations["Spotify_Text"]);
      setTranslation("SpotifyText2", ToolsTranslations["Spotify_Text2"]);
      document.getElementById("SpotifyQuery").setAttribute("placeholder", ToolsTranslations["Spotify_Query"]);
      setTranslation("SpotifyArtist", ToolsTranslations["Spotify_Artist"]);
      setTranslation("SpotifyTrack", ToolsTranslations["Spotify_Track"]);
      setTranslation("SpotifyAlbum", ToolsTranslations["Spotify_Album"]);
      setTranslation("SpotifyPlaylist", ToolsTranslations["Spotify_Playlist"]);
      setTranslation("SpotifySend", GenericTranslations["Send"]);

      function SendSpotifyRequest () {
        const selectedSpotifySearch = document.querySelector("input[name='spotifySearchType']:checked");
        if (!selectedSpotifySearch) {
          DoToast("error", "EXT-Spotify", null, "spotifySearchType missing");
          return;
        }
        document.getElementById("SpotifySend").classList.add("disabled");
        SpotifySend(document.getElementById("SpotifyQuery").value, selectedSpotifySearch.value, () => {
          document.getElementById("SpotifyQuery").value = "";
          DoToast("success", "EXT-Spotify", null, GenericTranslations["RequestDone"]);
        });
      }

      document.getElementById("SpotifyQuery").addEventListener("keyup", function (e) {
        const SpotifySendId = document.getElementById("SpotifySend");
        if (this.value.length > 1) {
          SpotifySendId.classList.remove("disabled");
        } else {
          SpotifySendId.classList.add("disabled");
        }
        if ((e.key === "Enter" || e.keyCode === 13) && !SpotifySendId.matches(".disabled")) {
          SendSpotifyRequest();
        }
      });

      document.getElementById("SpotifySend").onclick = function () {
        SendSpotifyRequest();
      };

      document.getElementById("SpotifyPlay").onclick = function () {
        SpotifyPlay(() => {
          DoToast("success", "EXT-Spotify", null, GenericTranslations["RequestDone"]);
        });
      };

      document.getElementById("SpotifyStop").onclick = function () {
        SpotifyStop(() => {
          DoToast("success", "EXT-Spotify", null, GenericTranslations["RequestDone"]);
        });
      };

      document.getElementById("SpotifyNext").onclick = function () {
        SpotifyNext(() => {
          DoToast("success", "EXT-Spotify", null, GenericTranslations["RequestDone"]);
        });
      };

      document.getElementById("SpotifyPrevious").onclick = function () {
        SpotifyPrevious(() => {
          DoToast("success", "EXT-Spotify", null, GenericTranslations["RequestDone"]);
        });
      };
      HideBlock("SpotifyBlock");
    } else {
      HideBlock("SpotifyBlock");
      HideBlock("SpotifyBlock2");
    }

    if (EXTStatus["EXT-YouTube"].hello) {
      setTranslation("YouTubeText", ToolsTranslations["YouTube_Text"]);
      setTranslation("YouTubeSend", GenericTranslations["Send"]);
      document.getElementById("YouTubeQuery").setAttribute("placeholder", ToolsTranslations["YouTube_Query"]);

      function SendYouTubeRequest () {
        document.getElementById("YouTubeSend").classList.add("disabled");
        doYouTubeQuery(document.getElementById("YouTubeQuery").value, () => {
          document.getElementById("YouTubeQuery").value = "";
          DoToast("success", "EXT-YouTube", null, GenericTranslations["RequestDone"]);
        });
      }

      document.getElementById("YouTubeQuery").addEventListener("keyup", function (e) {
        let YouTubeSend = document.getElementById("YouTubeSend");
        if (this.value.length > 5) {
          YouTubeSend.classList.remove("disabled");
        } else {
          YouTubeSend.classList.add("disabled");
        }
        if ((e.key === "Enter" || e.keyCode === 13) && !YouTubeSend.matches(".disabled")) {
          SendYouTubeRequest();
        }
      });

      document.getElementById("YouTubeSend").onclick = function () {
        SendYouTubeRequest();
      };
    } else {
      HideBlock("YouTubeBlock");
    }

    function updateTools () {
      if (EXTStatus["EXT-Screen"].hello) {
        if (EXTStatus["EXT-Screen"].power) setTranslation("ScreenPower", GenericTranslations["TurnOff"]);
        else setTranslation("ScreenPower", GenericTranslations["TurnOn"]);
      }

      if (EXTStatus["EXT-Volume"].hello) {
        setTranslation("SpeakerValue", `${EXTStatus["EXT-Volume"].speaker}%`);
        setTranslation("MicValue", `${EXTStatus["EXT-Volume"].recorder}%`);
      }

      if (hasPluginConnected(EXTStatus, "connected", true)) ShowBlock("StopBlock");
      else HideBlock("StopBlock");

      if (EXTStatus["EXT-Updates"].hello) {
        let needUpdate = 0;
        var updateModules = EXTStatus["EXT-Updates"].module;
        if (!updateModules || !Object.keys(updateModules).length) HideBlock("UpdateBlock");
        if (Object.keys(updateModules).length) {
          ShowBlock("UpdateBlock");
          for (const [name] of Object.entries(updateModules)) {
            if (!document.getElementById(`${name}`)) {
              var UpdateModuleName = document.createElement("div");
              UpdateModuleName.id = `${name}`;
              UpdateModuleName.textContent = `${name}`;
              document.getElementById("UpdateFiled").appendChild(UpdateModuleName);
            }
            if (EXTStatus["EXT-Updates"].list.indexOf(name) > -1) ++needUpdate;
          }
        }
        if (!needUpdate) document.getElementById("UpdateApply").classList.add("disabled");
        else document.getElementById("UpdateApply").classList.remove("disabled");
      }

      if (EXTStatus["EXT-Spotify"].hello) {
        if (EXTStatus["EXT-Spotify"].connected || EXTStatus["EXT-Spotify"].remote) {
          ShowBlock("SpotifyBlock");
        } else {
          HideBlock("SpotifyBlock");
        }

        if (EXTStatus["EXT-Spotify"].play) {
          document.getElementById("SpotifyPlay").classList.add("d-none");
          document.getElementById("SpotifyStop").classList.remove("d-none");
          document.getElementById("SpotifyNext").classList.remove("disabled");
          document.getElementById("SpotifyPrevious").classList.remove("disabled");
        } else {
          document.getElementById("SpotifyPlay").classList.remove("d-none");
          document.getElementById("SpotifyStop").classList.add("d-none");
          document.getElementById("SpotifyNext").classList.add("disabled");
          document.getElementById("SpotifyPrevious").classList.add("disabled");
        }
      }

    }

    // live stream every secs of EXT for update
    interval = setInterval(async () => {
      EXTStatus = await checkEXTStatus();
      //console.warn("EXTs Status", EXTStatus);
      updateTools();
    }, 1000);

    removeLoader();
  }
}

async function doConfigPage () {
  // view Config page
  let viewConfigPage = document.getElementById("viewConfig-html");
  if (viewConfigPage) {
    console.log("detected view Config page");
    setTranslation("ConfigTitle", await getTranslate(user.language, "Configuration_View"));
    var modules = await loadMMConfig();
    const container = document.getElementById("jsoneditor");

    const options = {
      mode: "code",
      mainMenuBar: false,
      onEditable (node) {
        if (!node.path) {
          // In modes code and text, node is empty: no path, field, or value
          // returning false makes the text area read-only
          return false;
        }
      }
    };
    new JSONEditor(container, options, modules);
    removeLoader();
  }
}

async function doEditConfigPage () {
  // edit Config page
  let editConfigPage = document.getElementById("editConfig-html");
  if (editConfigPage) {
    console.log("detected edit Config page");

    const GenericTranslations = await getTranslateGroup(user.language, "Generic_");
    const ConfigurationTranslations = await getTranslateGroup(user.language, "Configuration_");

    let LoadFile = document.getElementById("externalLoad");
    LoadFile.setAttribute("data-bs-title", ConfigurationTranslations["LoadTip"]);
    let SaveFile = document.getElementById("externalSave");
    SaveFile.setAttribute("data-bs-title", ConfigurationTranslations["SaveTip"]);

    setTranslation("ConfigTitle", ConfigurationTranslations["Editor"]);
    setTranslation("wait", GenericTranslations["Wait"]);
    setTranslation("done", GenericTranslations["Done"]);
    setTranslation("error", GenericTranslations["Error"]);
    setTranslation("errorConfig", GenericTranslations["Error"]);
    setTranslation("save", GenericTranslations["Save"]);
    setTranslation("load", GenericTranslations["Load"]);
    document.getElementById("wait").classList.add("d-none");
    document.getElementById("done").classList.add("d-none");
    document.getElementById("error").classList.add("d-none");
    document.getElementById("errorConfig").classList.add("d-none");
    document.getElementById("load").classList.add("d-none");
    document.getElementById("save").classList.add("d-none");
    document.getElementById("buttonGrp").classList.remove("invisible");
    let ActualConfig = document.querySelectorAll("option")[0];
    ActualConfig.textContent = ConfigurationTranslations["AcualConfig"];
    const allBackup = await loadBackupNames();
    var config = {};
    var conf = null;
    var options = {
      mode: "code",
      mainMenuBar: false,
      onValidationError: (errors) => {
        if (errors.length) {
          document.getElementById("save").classList.add("d-none");
          document.getElementById("externalSave").classList.add("d-none");
          document.getElementById("errorConfig").classList.remove("d-none");
        }
        else {
          document.getElementById("errorConfig").classList.add("d-none");
          document.getElementById("save").classList.remove("d-none");
          document.getElementById("externalSave").classList.remove("d-none");
        }
      }
    };

    if (window.location.search) {
      /* eslint-disable no-useless-escape */
      conf = decodeURIComponent(window.location.search.match(/(\?|&)config\=([^&]*)/)[2]);
      /* eslint-enable no-useless-escape */
      if (conf === "default") config = await loadMMConfig();
      else {
        options = {
          mode: "code",
          mainMenuBar: false,
          onEditable (node) {
            if (!node.path) {
              // In modes code and text, node is empty: no path, field, or value
              // returning false makes the text area read-only
              return false;
            }
          }
        };
        config = await loadBackupConfig(conf);
        document.getElementById("load").classList.remove("d-none");
      }
    } else {
      conf = "default";
      config = await loadMMConfig();
    }

    const backup = document.getElementById("backup");

    allBackup.forEach((filename, i) => {
      let option = document.createElement("option");
      option.classList.add("bg-white");
      option.value = filename;
      option.text = filename;
      backup.appendChild(option);
      if (filename === conf) backup.selectedIndex = i + 1;
    });

    const container = document.getElementById("jsoneditor");
    const editor = new JSONEditor(container, options, config);

    document.getElementById("load").onclick = function () {
      document.getElementById("load").classList.add("d-none");
      document.getElementById("wait").classList.remove("d-none");

      loadBackup(conf, async () => {
        document.getElementById("wait").classList.add("d-none");
        document.getElementById("done").classList.remove("d-none");
        DoToast("success", "MMM-Bugsounet", null, GenericTranslations["Restart-Long"]);
      }, (err) => {
        document.getElementById("wait").classList.add("d-none");
        document.getElementById("error").classList.remove("d-none");
        DoToast("error", `Error ${err.status}`, "loadBackup", err.body);
      });
    };

    document.getElementById("save").onclick = function () {
      let data = editor.getText();
      document.getElementById("save").classList.add("d-none");
      document.getElementById("wait").classList.remove("d-none");
      let encode = btoa(data);

      writeConfig(encode, async () => {
        document.getElementById("wait").classList.add("d-none");
        document.getElementById("done").classList.remove("d-none");
        DoToast("success", "MMM-Bugsounet", null, GenericTranslations["Restart-Long"]);
      }, (err) => {
        document.getElementById("wait").classList.add("d-none");
        document.getElementById("error").classList.remove("d-none");
        DoToast("error", `Error ${err.status}`, "writeConfig", err.body);
      });
    };

    document.getElementById("externalLoad").onclick = async function () {
      Swal.fire({
        icon: "question",
        title: ConfigurationTranslations["LoadTip"],
        input: "file",
        inputAttributes: {
          accept: "text/javascript",
          "aria-label": GenericTranslations["ConfigName"]
        },
        confirmButtonText: GenericTranslations["Import"],
        cancelButtonText: GenericTranslations["Cancel"],
        showCancelButton: true,
        customClass: {
          confirmButton: "btn btn-success btn-round bg-google-green me-3",
          cancelButton: "btn btn-dark btn-round bg-google-grey-19"
        },
        inputValidator: (value) => {
          if (!value) {
            return GenericTranslations["ConfigName"];
          }
        },
        didOpen: () => {
          contentWrapper.classList.add("blur");
        },
        willClose: () => {
          contentWrapper.classList.remove("blur");
        }
      }).then((result) => {
        if (result.isConfirmed) {
          const reader = new FileReader();
          reader.onload = (event) => {
            let encodedConfig = btoa(event.target.result);
            readBackup(encodedConfig, (back) => {
              let decode = atob(back.config);
              let config = JSON.parse(decode);
              editor.update(config);
              editor.refresh();
              DoToast("success", "MMM-Bugsounet", null, GenericTranslations["ConfigLoaded"]);
            });
          };
          reader.readAsText(result.value);
        }
      });
    };

    document.getElementById("externalSave").onclick = function () {
      Swal.fire({
        icon: "question",
        title: ConfigurationTranslations["SaveTip"],
        input: "text",
        text: ConfigurationTranslations["Filename"],
        inputValue: "config.js",
        confirmButtonText: GenericTranslations["Export"],
        cancelButtonText: GenericTranslations["Cancel"],
        showCancelButton: true,
        customClass: {
          confirmButton: "btn btn-success btn-round bg-google-green me-3",
          cancelButton: "btn btn-dark btn-round bg-google-grey-19"
        },
        inputValidator: (value) => {
          if (!value || !value.endsWith(".js")) {
            return GenericTranslations["FileName"];
          }
        },
        didOpen: () => {
          contentWrapper.classList.add("blur");
        },
        willClose: () => {
          contentWrapper.classList.remove("blur");
        }
      }).then((result) => {
        if (result.isConfirmed) {
          var fileName = result.value;
          var configToSave = editor.getText();
          let encoded = btoa(configToSave);
          saveBackup(encoded, (back) => {
            DoToast("success", "MMM-Bugsounet", null, GenericTranslations["DownloadReady"]);
            fetch(back.file)
              .then((response) => response.blob())
              .then((blob) => saveAs(blob, fileName))
              .catch((e) => {
                console.error("Download Error:", e);
                DoToast("error", "MMM-Bugsounet", null, "Download Error!");
              });
          });
        }
      });
    };

    removeLoader();
  }
}

async function do404Page () {
  // 404 Page
  let Page404 = document.getElementById("404-html");
  if (Page404) {
    function getRandomIntInclusive (min, max) {
      const Min = Math.ceil(min);
      const Max = Math.floor(max);
      return Math.floor(Math.random() * (Max - Min + 1)) + Min;
    }

    let random = getRandomIntInclusive(1, 4);
    Swal.fire({
      title: "Error 404",
      text: "The page you are looking for was moved, removed or might never existed.",
      icon: "warning",
      imageUrl: `/assets/images/404/${random}.jpeg`,
      showClass: {
        icon: "swal2-icon-show border-danger"
      },
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      theme: "dark"
    });
  }
}

async function doAdminPage () {
  // Admin page
  let AdminPage = document.getElementById("admin-html");
  if (AdminPage) {
    console.log("detected edit Admin page");

    // user login

    const LoginPrefs = await getLoginPrefs();
    const AllUsers = await getAllUsers();
    console.warn("AllUsers", AllUsers);

    const AccountTranslations = await getTranslateGroup(user.language, "Account_");
    const AdminTranslations = await getTranslateGroup(user.language, "Admin_");

    setTranslation("Login", AdminTranslations["Login"]);
    setTranslation("Accounts", AdminTranslations["Users"]);

    await UpdateFlagsLanguage(user, "LoginLanguageSelectorDropdown");
    FlagsSelector(LoginPrefs, "LoginLanguageButton", "LoginSelectedLanguage", "LoginLanguageSelectorDropdown");

    setTranslation("LoginBackground", AccountTranslations["BackgroundTheme"]);
    setTranslation("LoginPrefs", AdminTranslations["LoginPrefs"]);

    const backgroundInput = document.querySelector(`input[name="background"][value="${LoginPrefs.background}"]`);
    if (backgroundInput) backgroundInput.checked = true;
    document.getElementById("SaveLoginPrefs").value = AccountTranslations["SaveChange"];

    const SaveLoginChange = document.getElementById("SaveLoginPrefs");
    SaveLoginChange.onclick = function () {
      const selectedLanguageInput = document.getElementById("LoginSelectedLanguage").value;
      const selectedBackgroundInput = document.querySelector("input[name='background']:checked");

      let MyLogin = {};
      if (selectedLanguageInput !== LoginPrefs.language) MyLogin.language = selectedLanguageInput;
      let selectedBackgroundValue = null;
      if (selectedBackgroundInput) {
        selectedBackgroundValue = parseInt(selectedBackgroundInput.value);
        if (selectedBackgroundValue !== LoginPrefs.background) MyLogin.background = selectedBackgroundValue;
      }

      let MyLoginSize = Object.keys(MyLogin).length;
      if (MyLoginSize > 0) {
        putLoginPrefs(MyLogin, async () => {
          await doAdminPage();
          DoToast("success", "Admin", AdminTranslations["Login"], "New login preferences applied");
        });
      } else {
        DoToast("warning", "Admin", AdminTranslations["Login"], "There is no change to save");
      }
    };

    // user management
    var NewUser = {
      background: 2,
      topbar: 26,
      level: 1,
      language: "en"
    };
    const switchUserDisabled = document.getElementById("switchUserDisabled");
    const switchNewUser = document.getElementById("switchNewUser");
    const newpassword = document.getElementById("newpassword");
    const password = document.getElementById("password");
    const PasswordStrengthChecker = document.getElementById("PasswordStrengthChecker");
    const LengthGrp = document.getElementById("LengthGrp");
    const UserLanguageButton = document.getElementById("UserLanguageButton");
    const AvatarsGrp = document.getElementById("AvatarsGrp");

    switchNewUser.onclick = function () {
      const AdminSaveChange = document.getElementById("AdminSaveChange");
      const AdminDelete = document.getElementById("AdminDelete");
      const AdminNewUser = document.getElementById("AdminNewUser");
      const UserSelectButton = document.getElementById("UserSelectButton");
      const UserName = document.getElementById("username");

      if (switchNewUser.checked) {
        AdminSaveChange.classList.add("d-none");
        AdminDelete.classList.add("d-none");
        AdminNewUser.classList.remove("d-none");
        UserSelectButton.classList.add("d-none");
        UserName.classList.remove("d-none");

        document.getElementById("username").value = "";
        switchUserDisabled.checked = false;
        LevelSelector(NewUser);
        FlagsSelector(NewUser, "UserLanguageButton", "UserSelectedLanguage", "UserLanguageSelectorDropdown");
        password.setAttribute("passwordStrength", "");
        PasswordStrengthChecker.setAttribute("data-strength-check", "");
        LengthGrp.classList.remove("LengthGrp");
        password.value = "";
        newpassword.value = "";
        newpassword.disabled = true;
        UserLanguageButton.classList.remove("disabled");
        AvatarsGrp.classList.remove("d-none");
      } else {
        AdminSaveChange.classList.remove("d-none");
        AdminDelete.classList.remove("d-none");
        AdminNewUser.classList.add("d-none");
        UserSelectButton.classList.remove("d-none");
        UserName.classList.add("d-none");
        checkFirstUser();
      }
    };

    function checkFirstUser () {
      if ((AllUsers[0].username === user.username) && (AllUsers[0].id === user.id) || AllUsers[0].level >= user.level) {
        AdminDelete.disabled = true;
        AdminSaveChange.disabled = true;
      }

      if (AllUsers[0].disabled) switchUserDisabled.checked = true;
      else switchUserDisabled.checked = false;

      FlagsSelector(AllUsers[0], "UserLanguageButton", "UserSelectedLanguage", "UserLanguageSelectorDropdown");

      if (UserAvatarInput) UserAvatarInput.checked = true;

      UserSelector(AllUsers[0]);
      LevelSelector(AllUsers[0]);

      password.setAttribute("passwordStrength", "");
      PasswordStrengthChecker.setAttribute("data-strength-check", "");
      LengthGrp.classList.remove("LengthGrp");
      password.value = "";
      newpassword.value = "";
      newpassword.disabled = true;
      UserLanguageButton.classList.add("disabled");
      AvatarsGrp.classList.add("d-none");
    }

    await UpdateFlagsLanguage(user, "UserLanguageSelectorDropdown");

    const UserAvatarInput = document.querySelector(`input[name="avatar"][value="${AllUsers[0].avatar}"]`);
    if (UserAvatarInput) UserAvatarInput.checked = true;

    const UserSelectorDropdown = document.getElementById("UserSelectorDropdown");
    for (const user of AllUsers) {
      var Li = document.createElement("li");
      Li.innerHTML = `<a class="dropdown-item d-flex align-items-baseline" href="#" data-value="${user.username}" data-id="${user.id}">
        <i class="icon-user me-2"></i>
        <div id="${user.username}">${user.username}</div>
      </a>`;
      UserSelectorDropdown.appendChild(Li);
    }

    checkFirstUser();

    const selectedUser = document.getElementById("selectedUser");
    selectedUser.onchange = (event) => {
      const newId = event.target.getAttribute("identifier");

      console.log("change New User:", event.target.value, "ID:", newId);
      const UserFind = AllUsers.find(({ id }) => id === newId);
      LevelSelector(UserFind);
      FlagsSelector(UserFind, "UserLanguageButton", "UserSelectedLanguage", "UserLanguageSelectorDropdown");
      if (UserFind.disabled) switchUserDisabled.checked = true;
      else switchUserDisabled.checked = false;
      const NewUserAvatarInput = document.querySelector(`input[name="avatar"][value="${UserFind.avatar}"]`);
      if (NewUserAvatarInput) NewUserAvatarInput.checked = true;
      if ((UserFind.username === user.username) && (UserFind.id === user.id) || UserFind.level >= user.level) {
        AdminDelete.disabled = true;
        AdminSaveChange.disabled = true;
      } else {
        AdminDelete.disabled = false;
        AdminSaveChange.disabled = false;
      }
    };

    const ChangeUser = document.getElementById("AdminSaveChange");
    ChangeUser.onclick = function () {
      AddSpinner();
      const SelectedUserChange = document.getElementById("selectedUser");
      const UserChangeUsername = SelectedUserChange.value;
      const UserChangeID = SelectedUserChange.getAttribute("identifier");
      const NewPassword = document.getElementById("password").value;
      const NewPasswordConfirm = document.getElementById("newpassword").value;
      const UserFind = AllUsers.find(({ id }) => id === UserChangeID);
      var userChange = {
        username: UserChangeUsername,
        id: UserChangeID
      };

      if (switchUserDisabled.checked !== UserFind.disabled) userChange.disabled = switchUserDisabled.checked;

      const selectedLevel = document.getElementById("selectedLevel");
      if (selectedLevel.value) {
        let level = parseInt(selectedLevel.value);
        if (level >= user.level) {
          DoToast("error", "Admin", userChange.username, "Can't add a level higher or equal than yours");
        }
        else if (level !== UserFind.level) userChange.level = level;
      }
      else DoToast("error", "Admin", userChange.username, "Level Missing");

      if (NewPassword !== "") {
        if (NewPassword !== NewPasswordConfirm) DoToast("error", "Admin", userChange.username, "Password don't match");
        else {
          if (password.getAttribute("passwordstrength") !== "Strong") DoToast("error", "Admin", userChange.username, "Password must be Strong");
          else userChange.password = btoa(NewPassword);
        }
      }

      let userChangeSize = Object.keys(userChange).length;
      if (userChangeSize > 2) {
        updateUser(userChange, async () => {
          const contentArea = document.querySelector(".content-container");
          await loadContentDynamically("/html/admin.html", contentArea);

          const loginTab = document.getElementById("loginTab");
          const loginContent = document.getElementById("login");
          const accountsTab = document.getElementById("accountsTab");
          const accountsContent = document.getElementById("accounts");
          loginTab.classList.remove("active");
          accountsTab.classList.add("active");
          loginContent.classList.remove("active", "show");
          accountsContent.classList.add("active", "show");
          const newContentEvent = new Event("NewContent_Loaded");
          document.dispatchEvent(newContentEvent);
          DoToast("success", "Admin", userChange.username, "Profil Updated successfully");
        });
      } else {
        DoToast("warning", "Admin", userChange.username, "There is no change to save");
        removeLoader();
      }
    };

    const DeleteUser = document.getElementById("AdminDelete");
    DeleteUser.onclick = function () {
      const SelectedUserDelete = document.getElementById("selectedUser");
      const UserDeleteUsername = SelectedUserDelete.value;
      const UserDeleteID = SelectedUserDelete.getAttribute("identifier");
      const contentWrapper = document.querySelector(".content-wrapper");
      Swal.fire({
        title: "Are you sure?",
        text: `I will delete this user: ${UserDeleteUsername}`,
        icon: "warning",
        showCancelButton: true,
        didOpen: () => {
          contentWrapper.classList.add("blur");
        },
        willClose: () => {
          contentWrapper.classList.remove("blur");
        },
        customClass: {
          confirmButton: "btn btn-primary btn-round me-3",
          cancelButton: "btn btn-dark btn-round"
        },
        allowOutsideClick: false
      }).then((result) => {
        if (result.isConfirmed) {
          deleteUser({ username: UserDeleteUsername, id: UserDeleteID }, async () => {
            const contentArea = document.querySelector(".content-container");
            await loadContentDynamically("/html/admin.html", contentArea);

            const loginTab = document.getElementById("loginTab");
            const loginContent = document.getElementById("login");
            const accountsTab = document.getElementById("accountsTab");
            const accountsContent = document.getElementById("accounts");
            loginTab.classList.remove("active");
            accountsTab.classList.add("active");
            loginContent.classList.remove("active", "show");
            accountsContent.classList.add("active", "show");
            const newContentEvent = new Event("NewContent_Loaded");
            document.dispatchEvent(newContentEvent);
            DoToast("success", "Admin", UserDeleteUsername, "User Deleted!");
          });
        }
      });
    };

    const CreateUser = document.getElementById("AdminNewUser");
    CreateUser.onclick = async function () {
      AddSpinner();
      const NewUsername = document.getElementById("username").value;
      const NewPassword = document.getElementById("password").value;
      const NewPasswordConfirm = document.getElementById("newpassword").value;
      const selectedLanguageInput = document.getElementById("UserSelectedLanguage").value;

      if (switchUserDisabled.checked) NewUser.disabled = true;
      else NewUser.disabled = false;

      if (NewUsername === "") DoToast("error", "Admin", null, "Username Missing");
      else {
        const FindUserAlreadyExist = AllUsers.find(({ username }) => username === NewUsername);
        if (FindUserAlreadyExist) DoToast("error", "Admin", NewUsername, "Username already exist");
        else NewUser.username = NewUsername;
      }

      const selectedLevel = document.getElementById("selectedLevel");
      if (selectedLevel.value) {
        let level = parseInt(selectedLevel.value);
        if (level >= user.level) DoToast("error", "Admin", NewUser.username, "Can't add a level higher or equal than yours");
        else NewUser.level = level;
      }
      else DoToast("error", "Admin", NewUser.username, "Level Missing");

      const selectedAvatarInput = document.querySelector("input[name='avatar']:checked");
      let selectedAvatarValue = null;
      if (selectedAvatarInput) {
        selectedAvatarValue = parseInt(selectedAvatarInput.value);
        NewUser.avatar = selectedAvatarValue;
      }
      else DoToast("error", "Admin", NewUser.username, "Avatar Missing");

      if (selectedLanguageInput) NewUser.language = selectedLanguageInput;
      else DoToast("error", "Admin", NewUser.username, "User Language Missing");

      if ((NewPassword !== NewPasswordConfirm) && NewPassword !== "") {
        DoToast("error", "Admin", NewUser.username, "Password don't match");
      } else if (password.getAttribute("passwordstrength") !== "Strong") {
        DoToast("error", "Admin", NewUser.username, "Password must be Strong");
      } else if (NewPassword !== "") {
        NewUser.password = btoa(NewPassword);
      } else {
        DoToast("error", "Admin", NewUser.username, "Please select a Password");
      }

      let NewUserSize = Object.keys(NewUser).length;
      if (NewUserSize === 8) {
        putNewUser(NewUser, async () => {
          const contentArea = document.querySelector(".content-container");
          await loadContentDynamically("/html/admin.html", contentArea);

          const loginTab = document.getElementById("loginTab");
          const loginContent = document.getElementById("login");
          const accountsTab = document.getElementById("accountsTab");
          const accountsContent = document.getElementById("accounts");
          loginTab.classList.remove("active");
          accountsTab.classList.add("active");
          loginContent.classList.remove("active", "show");
          accountsContent.classList.add("active", "show");
          const newContentEvent = new Event("NewContent_Loaded");
          document.dispatchEvent(newContentEvent);
          DoToast("success", "Admin", NewUser.username, "User added with success!");
        });
      } else {
        DoToast("warning", "Admin", null, "Please Correct this form");
        removeLoader();
      }
    };

    removeLoader();
  }
}
