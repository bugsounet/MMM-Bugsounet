/* global alertify setTranslation getTranslate getEXTVersions getCurrentSystem
  checkSystem io Terminal FitAddon getVersion getCurrentToken getHomeText applyNavbarTheme
  getMyUser loadLoginTranslation saveAs FileReaderJS JSONEditor loadMMConfig loadBackupConfig loadBackupNames
  bootstrap
 */

/* eslint-disable max-lines-per-function */
document.addEventListener("Includes_Complete", async () => {
  console.log("Execute index.js");

  // define all vars
  var translation = {};
  var version = {};
  var user = {};

  const spinner = document.getElementById("spinner");
  function spinnerHide () {
    if (spinner) spinner.classList.remove("show");
  }

  const contentWrapper = document.querySelector(".content-wrapper");
  const iframeChild = document.querySelector("iframe");
  if (iframeChild) {
    console.log("detected iframe");
    contentWrapper.classList.add("has-iframe");
  }

  let password = document.getElementById("password");
  if (password) {
    console.log("detected password");
    let eyeIcon = document.getElementsByClassName("toggle-password");
    Array.from(eyeIcon).forEach((icon) => {
      icon.addEventListener("click", function () {
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
      });
    });
  }

  // login page
  let loginPage = document.getElementById("login-html");
  if (loginPage) {
    console.log("detected login page");
    translation = await loadLoginTranslation();

    document.getElementById("username").setAttribute("placeholder", translation.username);
    document.getElementById("password").setAttribute("placeholder", translation.password);
    setTranslation("login-submit", translation.login);

    const button = document.getElementById("login");
    button.addEventListener("change", function () {
      if (document.getElementById("username").value !== "" && document.getElementById("password").value !== "") {
        document.getElementById("login-submit").classList.remove("disabled");
      } else {
        document.getElementById("login-submit").classList.add("disabled");
      }
    });
    button.addEventListener("submit", function () {
      event.preventDefault();
      alertify.set("notifier", "position", "top-center");
      let credentials = `${document.getElementById("username").value}:${document.getElementById("password").value}`;
      let encode = btoa(credentials);
      Request("/auth", "POST", { Authorization: `Basic ${encode}` }, null, "Login", (response) => {
        localStorage.setItem("MMM-Bugsounet", JSON.stringify(response.session));
        location.href = "/";
      }, (err) => {
        document.getElementById("username").value = "";
        document.getElementById("password").value = "";
        let error = err?.error;
        let description = err?.description;
        if (!err.status) alertify.error("Connexion Lost!");
        else if (err.status === 403 || err.status === 401) alertify.error(`${error}: ${description}`);
        else alertify.error(`Server return Error ${err.status} (${error})`);
      });
    });
    spinnerHide();
    return;
  }

  // sidebar and navbar
  let SideNavBar = document.getElementById("sidebar-wrapper");
  if (SideNavBar) {
    console.log("detected SideNavBar");
    user = await getMyUser();
    console.warn("User:", user);

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
    if (user.level === 10) setTranslation("mylevel", await getTranslate(user.language, "Administrator"));
    else setTranslation("mylevel", await getTranslate(user.language, "Level", { level: user.level }));
    if (user.avatar) {
      let Avatar = document.getElementById("Avatar");
      if (user.avatar) Avatar.src = `/assets/images/avatars/avatar${user.avatar}.png`;
    }
    setTranslation("Account", await getTranslate(user.language, "Account"));
    setTranslation("Logout", await getTranslate(user.language, "Logout"));

    setTranslation("Home", await getTranslate(user.language, "Menu_Home"));
    setTranslation("Dashboard", await getTranslate(user.language, "Menu_Dashboard"));
    setTranslation("MMConfig", await getTranslate(user.language, "Menu_Config"));
    setTranslation("MMView", await getTranslate(user.language, "Menu_Config_View"));
    setTranslation("MMEdit", await getTranslate(user.language, "Menu_Config_Edit"));
    setTranslation("Terminal", await getTranslate(user.language, "Menu_Terminal"));
    setTranslation("TerminalLogs", await getTranslate(user.language, "Menu_Terminal_Logs"));
    setTranslation("TerminalSSH", await getTranslate(user.language, "Menu_Terminal_SSH"));
    setTranslation("Tools", await getTranslate(user.language, "Menu_Tools"));
    setTranslation("System", await getTranslate(user.language, "Menu_System"));
    setTranslation("3rdPartyModules", await getTranslate(user.language, "Menu_3rdPartyModules"));
    setTranslation("API", await getTranslate(user.language, "Menu_API"));
    setTranslation("About", await getTranslate(user.language, "Menu_About"));
  }

  // Home page
  let homePage = document.getElementById("home-html");
  if (homePage) {
    console.log("detected Home page");
    setTranslation("welcome", await getTranslate(user.language, "Home_Welcome"));
    document.getElementById("HomeText").innerHTML = await getHomeText(user.language);
    spinnerHide();
  }

  // account page
  let accountPage = document.getElementById("account-html");
  if (accountPage) {
    console.log("detected Account page");

    // translation
    setTranslation("Profile", await getTranslate(user.language, "Account_Profile"));
    setTranslation("Background", await getTranslate(user.language, "Account_Background"));
    setTranslation("Navbar", await getTranslate(user.language, "Account_Navbar"));

    setTranslation("UserProfile", await getTranslate(user.language, "Account_UserProfile"));
    setTranslation("UsernameProfile", await getTranslate(user.language, "Account_UsernameProfile"));
    setTranslation("LevelProfile", await getTranslate(user.language, "Account_LevelProfile"));
    setTranslation("AvatarProfile", await getTranslate(user.language, "Account_AvatarProfile"));
    setTranslation("ChangePassword", await getTranslate(user.language, "Account_ChangePassword"));
    setTranslation("PasswordProfile", await getTranslate(user.language, "Account_PasswordProfile"));
    setTranslation("NewPasswordProfile", await getTranslate(user.language, "Account_NewPasswordProfile"));

    setTranslation("English", await getTranslate(user.language, "Language_English"));
    setTranslation("French", await getTranslate(user.language, "Language_French"));
    setTranslation("German", await getTranslate(user.language, "Language_German"));
    setTranslation("Italian", await getTranslate(user.language, "Language_Italian"));
    setTranslation("Spanish", await getTranslate(user.language, "Language_Spanish"));
    setTranslation("Dutch", await getTranslate(user.language, "Language_Dutch"));
    setTranslation("Turkish", await getTranslate(user.language, "Language_Turkish"));

    setTranslation("BackgroundProfile", await getTranslate(user.language, "Account_BackgroundTheme"));
    setTranslation("NavbarProfile", await getTranslate(user.language, "Account_NavbarTheme"));

    document.getElementById("password").setAttribute("placeholder", await getTranslate(user.language, "Account_NewPassword"));
    document.getElementById("newpassword").setAttribute("placeholder", await getTranslate(user.language, "Account_NewPasswordConfim"));

    document.getElementById("SaveChange").value = await getTranslate(user.language, "Account_SaveChange");
    document.getElementById("username").value = user.username;
    if (user.level === 10) document.getElementById("LevelUser").value = await getTranslate(user.language, "Account_Administrator");
    else document.getElementById("LevelUser").value = user.level;

    const avatarInput = document.querySelector(`input[name="avatar"][value="${user.avatar}"]`);
    if (avatarInput) avatarInput.checked = true;

    // Get all the dropdown items
    const dropdownLanguageItems = document.querySelectorAll("a.dropdown-item"); // Select the 'a' tag

    // Get the hidden input field
    const selectedLanguageInput = document.getElementById("selectedLanguage");

    // Get the dropdown button
    const dropdownLanguageButton = document.getElementById("LanguageButton");

    // --- Set the default language on page load ---
    const defaultLanguageValue = user.language;

    // Find the dropdown item that matches the default language value
    const defaultLanguageItem = Array.from(dropdownLanguageItems).find((item) => {
      return item.getAttribute("data-value") === defaultLanguageValue;
    });

    // If a default item is found, set it as the selected one initially
    if (defaultLanguageItem) {
      const defaultLanguageTextElement = defaultLanguageItem.querySelector("div");
      const defaultLanguageText = defaultLanguageTextElement ? defaultLanguageTextElement.textContent.trim() : "";

      const defaultLanguageFlagIconElement = defaultLanguageItem.querySelector("i.flag-icon");
      const defaultLanguageFlagIconHtml = defaultLanguageFlagIconElement ? defaultLanguageFlagIconElement.outerHTML : "";

      // Update the value of the hidden input field
      if (selectedLanguageInput) {
        selectedLanguageInput.value = defaultLanguageValue;
      }

      // Update the text and flag on the dropdown button
      if (dropdownLanguageButton) {
        dropdownLanguageButton.innerHTML = `${defaultLanguageFlagIconHtml} ${defaultLanguageText}`;
      }
    } else {
      console.warn(`Dropdown item with data-value="${defaultLanguageValue}" not found for default selection.`);
    }
    // --- End of default country setting ---

    // Add a click event listener to each dropdown item
    dropdownLanguageItems.forEach((item) => {
      item.addEventListener("click", function (e) {
        e.preventDefault();

        // Get the value from the 'data-value' attribute of the clicked 'a' tag
        const selectedLanguageValue = this.getAttribute("data-value");

        // Find the div containing the text and get its text content
        const selectedLanguageTextElement = this.querySelector("div");
        const selectedLanguageText = selectedLanguageTextElement ? selectedLanguageTextElement.textContent.trim() : "";

        // Find the flag icon element (the <i> tag) and get its outerHTML
        const flagLanguageIconElement = this.querySelector("i.flag-icon");
        const flagLanguageIconHtml = flagLanguageIconElement ? flagLanguageIconElement.outerHTML : "";

        // Update the value of the hidden input field
        if (selectedLanguageInput) {
          selectedLanguageInput.value = selectedLanguageValue;
        }

        // update the text and image on the dropdown button
        if (dropdownLanguageButton) {
          // Clear existing content and add the flag icon and text
          dropdownLanguageButton.innerHTML = `${flagLanguageIconHtml} ${selectedLanguageText}`;
        }
      });
    });

    let newpassword = document.getElementById("newpassword");
    newpassword.value = "";
    newpassword.disabled = true;
    password.addEventListener("change", function () {
      if (password.value !== "") {
        newpassword.disabled = false;
      } else {
        newpassword.disabled = true;
        newpassword.value = "";
      }
    });

    const backgroundInput = document.querySelector(`input[name="background"][value="${user.background}"]`);
    if (backgroundInput) backgroundInput.checked = true;

    const navbarInput = document.querySelector(`input[name="navbar"][value="${user.topbar}"]`);
    if (navbarInput) navbarInput.checked = true;

    // save change
    const accountButton = document.getElementById("SaveChange");
    accountButton.addEventListener("click", function () {
      alertify.set("notifier", "position", "top-center");

      const NewUsername = document.getElementById("username").value;
      const NewPassword = document.getElementById("password").value;
      const NewPasswordConfirm = document.getElementById("newpassword").value;

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

      if (selectedLanguageInput.value !== user.language) MyUser.language = selectedLanguageInput.value;

      if ((NewPassword !== NewPasswordConfirm) && NewPassword !== "") {
        alertify.error("Password don't match");
      } else if (NewPassword !== "") {
        MyUser.password = btoa(NewPassword);
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
        Request("/api/me", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ me: btoa(JSON.stringify(MyUser)) }), "MyUser", () => { location.href = "/Account"; }, null);
      } else {
        alertify.message("There is no change to save");
      }
    });
    spinnerHide();
  }

  // logs page
  let logsPage = document.getElementById("logs-html");
  if (logsPage) {
    console.log("detected logs page");
    version = await getVersion();
    var timerLogsResize = null;
    let terminalTitle = document.getElementById("terminalTitle");
    terminalTitle.textContent = await getTranslate(user.language, "Terminal_Logs");
    var socketLogs = io();
    const termLogs = new Terminal({ cursorBlink: true });
    const fitAddonLogs = new FitAddon.FitAddon();
    termLogs.loadAddon(fitAddonLogs);
    termLogs.open(document.getElementById("terminal"));
    fitAddonLogs.fit();

    document.getElementsByTagName("BODY")[0].onresize = () => {
      clearTimeout(timerLogsResize);
      timerLogsResize = setTimeout(() => {
        console.log("resize");
        fitAddonLogs.fit();
      }, 300);
    };

    socketLogs.on("connect", () => {
      termLogs.write(`\x1B[1;3;31mMMM-Bugsounet v${version.version} (${version.rev}.${user.language})\x1B[0m \r\n\n`);
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
    spinnerHide();
  }

  let SSHPage = document.getElementById("SSH-html");
  if (SSHPage) {
    console.log("detected SSH page");
    version = await getVersion();
    var timerTermSSHResize = null;
    let terminalTitle = document.getElementById("terminalTitle");
    terminalTitle.textContent = await getTranslate(user.language, "Terminal_SSH");

    var socketPTY = io();
    const termPTY = new Terminal({ cursorBlink: true });
    const fitAddonPTY = new FitAddon.FitAddon();
    termPTY.loadAddon(fitAddonPTY);
    termPTY.open(document.getElementById("terminal"));
    fitAddonPTY.fit();

    document.getElementsByTagName("BODY")[0].onresize = () => {
      clearTimeout(timerTermSSHResize);
      timerTermSSHResize = setTimeout(() => {
        console.log("resize");
        fitAddonPTY.fit();
        if (termPTY.rows && termPTY.cols) {
          socketPTY.emit("terminal.size", { cols: termPTY.cols, rows: termPTY.rows });
        }
      }, 300);
    };

    if (termPTY.rows && termPTY.cols) {
      socketPTY.emit("terminal.size", { cols: termPTY.cols, rows: termPTY.rows });
    }

    socketPTY.on("connect", () => {
      termPTY.write(`\x1B[1;3;31mMMM-Bugsounet v${version.version} (${version.rev}.${user.language})\x1B[0m \r\n\n`);
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
    spinnerHide();
  }

  // system page
  let systemPage = document.getElementById("system-html");
  if (systemPage) {
    console.log("detected system page");
    var SystemFirstScan = true;
    var EXTVersions = {};
    var system = {};

    system = await getCurrentSystem();
    do_System(() => { do_SystemStatic(); });
    alertify.set("notifier", "position", "top-center");

    setInterval(async () => {
      system = await checkSystem();
      do_System();
    }, 15000);

    async function do_SystemStatic () {
      // Display static values
      setTranslation("HOSTNAME", system.HOSTNAME);

      setTranslation("VersionSystem", await getTranslate(user.language, "System_Box_Version"));
      setTranslation("NodeVersion", await getTranslate(user.language, "System_NodeVersion"));
      setTranslation("NPMVersion", await getTranslate(user.language, "System_NPMVersion"));
      setTranslation("OSVersion", await getTranslate(user.language, "System_OSVersion"));
      setTranslation("KernelVersion", await getTranslate(user.language, "System_KernelVersion"));

      setTranslation("MMVersion", system.VERSION.MagicMirror);
      setTranslation("ElectronVersion", system.VERSION.ELECTRON);
      setTranslation("NODECORE", system.VERSION.NODECORE);
      setTranslation("NPM", system.VERSION.NPM);
      setTranslation("OS", system.VERSION.OS);
      setTranslation("KERNEL", system.VERSION.KERNEL);

      setTranslation("NamePlugin", await getTranslate(user.language, "System_NamePlugin"));
      setTranslation("VersionPlugin", await getTranslate(user.language, "System_VersionPlugin"));
      setTranslation("RevPlugin", await getTranslate(user.language, "System_RevPlugin"));
      if (Object.entries(EXTVersions).length) setTranslation("CurrentlyRunning", await getTranslate(user.language, "System_CurrentlyRunning"));
      else setTranslation("CurrentlyRunning", await getTranslate(user.language, "System_NoPlugins"));

      setTranslation("CPUSystem", await getTranslate(user.language, "System_CPUSystem"));
      setTranslation("TypeCPU", await getTranslate(user.language, "System_TypeCPU"));
      setTranslation("SpeedCPU", await getTranslate(user.language, "System_SpeedCPU"));
      setTranslation("CurrentLoadCPU", await getTranslate(user.language, "System_CurrentLoadCPU"));
      setTranslation("GovernorCPU", await getTranslate(user.language, "System_GovernorCPU"));
      setTranslation("TempCPU", await getTranslate(user.language, "System_TempCPU"));

      setTranslation("CPU", system.CPU.type);

      if (system.GPU) {
        setTranslation("GPU", await getTranslate(user.language, "System_GPUAcceleration_Enabled"));
        const GPUAlert = document.getElementById("GPUAlert");
        const GPUWarn = document.getElementById("GPUWarn");
        GPUWarn.classList.add("visually-hidden");
        GPUAlert.classList.add("bg-google-green");
        GPUAlert.classList.remove("bg-google-red");
      } else {
        setTranslation("GPU", await getTranslate(user.language, "System_GPUAcceleration_Disabled"));
      }

      setTranslation("MemorySystem", await getTranslate(user.language, "System_MemorySystem"));
      setTranslation("TypeMemory", await getTranslate(user.language, "System_TypeMemory"));
      setTranslation("SwapMemory", await getTranslate(user.language, "System_SwapMemory"));

      setTranslation("NetworkSystem", await getTranslate(user.language, "System_NetworkSystem"));
      setTranslation("IPNetwork", await getTranslate(user.language, "System_IPNetwork"));
      setTranslation("InterfaceNetwork", await getTranslate(user.language, "System_InterfaceNetwork"));
      setTranslation("SpeedNetwork", await getTranslate(user.language, "System_SpeedNetwork"));
      setTranslation("DuplexNetwork", await getTranslate(user.language, "System_DuplexNetwork"));
      setTranslation("WirelessInfo", await getTranslate(user.language, "System_WirelessInfo"));
      setTranslation("SSIDNetwork", await getTranslate(user.language, "System_SSIDNetwork"));
      setTranslation("FrequencyNetwork", await getTranslate(user.language, "System_FrequencyNetwork"));
      setTranslation("SignalNetwork", await getTranslate(user.language, "System_SignalNetwork"));
      setTranslation("RateNetwork", await getTranslate(user.language, "System_RateNetwork"));
      setTranslation("QualityNetwork", await getTranslate(user.language, "System_QualityNetwork"));

      setTranslation("StorageSystem", await getTranslate(user.language, "System_StorageSystem"));
      setTranslation("MountStorage", await getTranslate(user.language, "System_MountStorage"));
      setTranslation("UsedStorage", await getTranslate(user.language, "System_UsedStorage"));
      setTranslation("PercentStorage", await getTranslate(user.language, "System_PercentStorage"));
      setTranslation("TotalStorage", await getTranslate(user.language, "System_TotalStorage"));

      setTranslation("UptimeSystem", await getTranslate(user.language, "System_UptimeSystem"));
      setTranslation("CurrentUptime", await getTranslate(user.language, "System_CurrentUptime"));
      setTranslation("SysCurrent", await getTranslate(user.language, "System_System"));
      setTranslation("RecordUptime", await getTranslate(user.language, "System_RecordUptime"));
      setTranslation("SysRecord", await getTranslate(user.language, "System_System"));

      document.getElementById("SystemDisplayer").classList.remove("visually-hidden");
      spinnerHide();
    }

    async function do_System (cb = null) {
      EXTVersions = await getEXTVersions();

      progressOrText(system);
      window.addEventListener("resize", function () {
        progressOrText(system);
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
        setTranslation("CurrentlyRunning", await getTranslate(user.language, "System_CurrentlyRunning"));
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

  // about page
  let aboutPage = document.getElementById("about-html");
  if (aboutPage) {
    console.log("detected about page");
    version = await getVersion();
    setTranslation("version", version.version);
    setTranslation("api", version.api);
    setTranslation("rev", version.rev);

    setTranslation("byHeader", await getTranslate(user.language, "About_by"));
    setTranslation("DonateHeader", await getTranslate(user.language, "About_Donate"));
    setTranslation("VersionHeader", await getTranslate(user.language, "About_About"));
    setTranslation("Translators", await getTranslate(user.language, "About_Translator"));

    for (let tr = 1; tr <= 10; tr++) {
      let trans = await getTranslate(user.language, `About_Translator${tr}`);
      if (tr === 1 && trans) document.getElementById("translatorsBox").classList.remove("visually-hidden");
      if (trans) setTranslation(`translator-${tr}`, trans);
      else break;
    }
    spinnerHide();
  }

  // API page
  let APIPage = document.getElementById("API-html");
  if (APIPage) {
    console.log("detected API page");
    spinnerHide();
  }

  // 3rdparty page
  let partyPage = document.getElementById("3rdparty-html");
  if (partyPage) {
    console.log("detected 3rdparty page");
    spinnerHide();
  }

  // tools page
  let toolsPage = document.getElementById("tools-html");
  if (toolsPage) {
    console.log("detected tools page");
    spinnerHide();
  }

  // view Config page
  let viewConfigPage = document.getElementById("viewConfig-html");
  if (viewConfigPage) {
    console.log("detected view Config page");
    setTranslation("ConfigTitle", await getTranslate(user.language, "Configuration_View"));
    //setTranslation("EditLoadButton", translation.Configuration_EditLoad);
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
    spinnerHide();
  }

  // edit Config page
  let editConfigPage = document.getElementById("editConfig-html");
  if (editConfigPage) {
    let LoadFile = document.getElementById("externalLoad");
    LoadFile.setAttribute("data-bs-title", await getTranslate(user.language, "Configuration_LoadTip"));
    let SaveFile = document.getElementById("externalSave");
    SaveFile.setAttribute("data-bs-title", await getTranslate(user.language, "Configuration_SaveTip"));

    setTranslation("ConfigTitle", await getTranslate(user.language, "Configuration_Editor"));
    setTranslation("wait", await getTranslate(user.language, "Wait"));
    setTranslation("done", await getTranslate(user.language, "Done"));
    setTranslation("error", await getTranslate(user.language, "Error"));
    setTranslation("errorConfig", await getTranslate(user.language, "Error"));
    setTranslation("save", await getTranslate(user.language, "Save"));
    setTranslation("load", await getTranslate(user.language, "Load"));
    document.getElementById("wait").style.display = "none";
    document.getElementById("done").style.display = "none";
    document.getElementById("error").style.display = "none";
    document.getElementById("errorConfig").style.display = "none";
    document.getElementById("load").style.display = "none";
    document.getElementById("save").style.display = "none";
    document.getElementById("buttonGrp").classList.remove("invisible");
    let ActualConfig = document.querySelectorAll("option")[0];
    ActualConfig.textContent = await getTranslate(user.language, "Configuration_AcualConfig");
    var allBackup = await loadBackupNames();
    var config = {};
    var conf = null;
    var options = {
      mode: "code",
      mainMenuBar: false,
      onValidationError: (errors) => {
        if (errors.length) {
          document.getElementById("save").style.display = "none";
          document.getElementById("externalSave").classList.add("disabled");
          document.getElementById("errorConfig").style.display = "block";
        }
        else {
          document.getElementById("errorConfig").style.display = "none";
          document.getElementById("save").style.display = "block";
          document.getElementById("externalSave").classList.remove("disabled");
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
        document.getElementById("load").style.display = "block";
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
      document.getElementById("load").style.display = "none";
      document.getElementById("wait").style.display = "block";

      Request("/api/backups/file", "PUT", { Authorization: `Bearer ${getCurrentToken()}`, backup: conf }, null, "loadBackup", async () => {
        document.getElementById("wait").style.display = "none";
        document.getElementById("done").style.display = "block";
        document.getElementById("alert").classList.remove("invisible");
        alertify.success(await getTranslate(user.language, "Restart"));
      }, (err) => {
        document.getElementById("wait").style.display = "none";
        document.getElementById("error").style.display = "block";
        document.getElementById("alert").classList.remove("invisible");
        document.getElementById("alert").classList.remove("alert-success");
        document.getElementById("alert").classList.add("alert-danger");
        let error = err.error;
        if (!err.status) {
          alertify.error("Connexion Lost!");
        } else {
          alertify.error(`[loadBackup] Server return Error ${err.status} (${error})`);
        }
      });
    };
    document.getElementById("save").onclick = function () {
      let data = editor.getText();
      document.getElementById("save").style.display = "none";
      document.getElementById("wait").style.display = "block";
      let encode = btoa(data);

      Request("api/config/MM", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ config: encode }), "writeConfig", async () => {
        document.getElementById("wait").style.display = "none";
        document.getElementById("done").style.display = "block";
        document.getElementById("alert").classList.remove("invisible");
        alertify.success(await getTranslate(user.language, "Restart"));
      }, (err) => {
        document.getElementById("wait").style.display = "none";
        document.getElementById("error").style.display = "block";
        document.getElementById("alert").classList.remove("invisible");
        document.getElementById("alert").classList.remove("alert-success");
        document.getElementById("alert").classList.add("alert-danger");
        let error = err.error;
        if (!err.status) {
          alertify.error("Connexion Lost!");
        } else {
          alertify.error(`[writeConfig] Server return Error ${err.status} (${error})`);
        }
      });
    };
    FileReaderJS.setupInput(document.getElementById("fileToLoad"), {
      readAsDefault: "Text",
      on: {
        load (event) {
          if (event.target.result) {
            let encode = btoa(event.target.result);
            Request("/api/backups/external", "POST", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ config: encode }), "readExternalBackup", (back) => {
              let decode = atob(back.config);
              let config = JSON.parse(decode);
              editor.update(config);
              editor.refresh();
              alertify.success("External Config Loaded !");
            }, null);
          }
        }
      }
    });
    document.getElementById("externalSave").onclick = function () {
      alertify.prompt("MMM-Bugsounet", "Save config file as:", "config.js", function (evt, value) {
        var fileName = value;
        if (fileName.indexOf(".") === -1) {
          fileName = `${fileName}.js`;
        } else {
          if (fileName.split(".").pop().toLowerCase() === "js") {
            // Nothing to do
          } else {
            fileName = `${fileName.split(".")[0]}.js`;
          }
        }
        var configToSave = editor.getText();
        let encode = btoa(configToSave);
        Request("/api/backups/external", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ config: encode }), "saveExternalBackup", (back) => {
          alertify.success("Download is ready !");
          fetch(back.file)
            .then((response) => response.blob())
            .then((result) => saveAs(result, fileName))
            .catch((e) => {
              console.error("Save Error:", e);
              alertify.error("Save Error!");
            });
        }, null);
      }, function () {
        // do nothing
      });
    };
    spinnerHide();
  }

  // enable tooltip
  var tooltipTriggerList = [].slice.call(document.querySelectorAll("[data-bs-toggle='tooltip']"));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl, { container: tooltipTriggerEl });
  });

});
