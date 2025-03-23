/** System
* @bugsounet
**/

/* global setTranslation, loadTranslation, forceMobileRotate, doTranslateNavBar, checkSystem, getEXTVersions */

// rotate rules
/* eslint-disable-next-line */
var PleaseRotateOptions = {
  startOnPageLoad: false
};

// define all vars
var translation = {};
var SystemFirstScan = true;
var EXTVersions = [];
var system = {};

// Load rules
window.addEventListener("load", async () => {
  translation = await loadTranslation();

  forceMobileRotate();
  doSystem(() => { doStatic(); });
  doTranslateNavBar();
  setInterval(() => {
    doSystem();
  }, 15000);
});

async function doSystem (cb = null) {
  system = await checkSystem();
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
    setTranslation("CurrentlyRunning", translation.System_CurrentlyRunning);
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
      percent.colSpan = 10;
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
      usedValue.setAttribute("style", "color: #000;font-weight: bold;text-align: right;margin-right: 5px;");
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

  const StorageBox = document.getElementById("Storage-Box");
  const VersionBox = document.getElementById("Version-Box");
  const UptimeBox = document.getElementById("Uptime-Box");

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
    StorageBox.classList.add("col-md-12");
    StorageBox.classList.remove("col-md-6");
    StorageBox.style.width = "100%";
    VersionBox.classList.add("col-md-12");
    VersionBox.classList.remove("col-md-6");
    VersionBox.style.width = "100%";
    UptimeBox.classList.add("col-md-12");
    UptimeBox.classList.remove("col-md-6");
    UptimeBox.style.width = "100%";
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
    StorageBox.classList.remove("col-md-12");
    StorageBox.classList.add("col-md-6");
    StorageBox.style.width = "50%";
    VersionBox.classList.remove("col-md-12");
    VersionBox.classList.add("col-md-6");
    VersionBox.style.width = "50%";
    UptimeBox.classList.remove("col-md-12");
    UptimeBox.classList.add("col-md-6");
    UptimeBox.style.width = "50%";
  }
}

function doStatic () {
  // Display static values
  setTranslation("HOSTNAME", system.HOSTNAME);
  setTranslation("CPU", system.CPU.type);
  setTranslation("MMVersion", system.VERSION.MagicMirror);
  setTranslation("ElectronVersion", system.VERSION.ELECTRON);
  setTranslation("GPU", system.GPU ? translation.System_GPUAcceleration_Enabled : translation.System_GPUAcceleration_Disabled);
  setTranslation("NODECORE", system.VERSION.NODECORE);
  setTranslation("NPM", system.VERSION.NPM);
  setTranslation("OS", system.VERSION.OS);
  setTranslation("KERNEL", system.VERSION.KERNEL);

  // translate all static
  setTranslation("ShutdownSystem", translation.System_Box_Shutdown);
  setTranslation("Shutdown", translation.System_Shutdown);
  setTranslation("RestartSystem", translation.System_Box_Restart);
  setTranslation("Restart", translation.System_Restart);

  setTranslation("VersionSystem", translation.System_Box_Version);
  setTranslation("NodeVersion", translation.System_NodeVersion);
  setTranslation("NPMVersion", translation.System_NPMVersion);
  setTranslation("OSVersion", translation.System_OSVersion);
  setTranslation("KernelVersion", translation.System_KernelVersion);

  setTranslation("CPUSystem", translation.System_CPUSystem);
  setTranslation("TypeCPU", translation.System_TypeCPU);
  setTranslation("SpeedCPU", translation.System_SpeedCPU);
  setTranslation("CurrentLoadCPU", translation.System_CurrentLoadCPU);
  setTranslation("GovernorCPU", translation.System_GovernorCPU);
  setTranslation("TempCPU", translation.System_TempCPU);

  setTranslation("MemorySystem", translation.System_MemorySystem);
  setTranslation("TypeMemory", translation.System_TypeMemory);
  setTranslation("SwapMemory", translation.System_SwapMemory);

  setTranslation("NetworkSystem", translation.System_NetworkSystem);
  setTranslation("IPNetwork", translation.System_IPNetwork);
  setTranslation("InterfaceNetwork", translation.System_InterfaceNetwork);
  setTranslation("SpeedNetwork", translation.System_SpeedNetwork);
  setTranslation("DuplexNetwork", translation.System_DuplexNetwork);
  setTranslation("WirelessInfo", translation.System_WirelessInfo);
  setTranslation("SSIDNetwork", translation.System_SSIDNetwork);
  setTranslation("FrequencyNetwork", translation.System_FrequencyNetwork);
  setTranslation("SignalNetwork", translation.System_SignalNetwork);
  setTranslation("RateNetwork", translation.System_RateNetwork);
  setTranslation("QualityNetwork", translation.System_QualityNetwork);

  setTranslation("StorageSystem", translation.System_StorageSystem);
  setTranslation("MountStorage", translation.System_MountStorage);
  setTranslation("UsedStorage", translation.System_UsedStorage);
  setTranslation("PercentStorage", translation.System_PercentStorage);
  setTranslation("TotalStorage", translation.System_TotalStorage);

  setTranslation("UptimeSystem", translation.System_UptimeSystem);
  setTranslation("CurrentUptime", translation.System_CurrentUptime);
  setTranslation("SysCurrent", translation.System_System);
  setTranslation("RecordUptime", translation.System_RecordUptime);
  setTranslation("SysRecord", translation.System_System);

  setTranslation("NamePlugin", translation.System_NamePlugin);
  setTranslation("VersionPlugin", translation.System_VersionPlugin);
  setTranslation("RevPlugin", translation.System_RevPlugin);
  if (Object.entries(EXTVersions).length) setTranslation("CurrentlyRunning", translation.System_CurrentlyRunning);
  else setTranslation("CurrentlyRunning", translation.System_NoPlugins);
  if (system.GPU) {
    const GPU = document.getElementById("GPU");
    GPU.classList.remove("animated");
    GPU.classList.remove("text-google-red");
    GPU.classList.add("text-google-green");
  }
  document.getElementById("SystemDisplayer").classList.remove("visually-hidden");
}
