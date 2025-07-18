/* eslint-disable no-unused-vars */

/* global getTranslateGroup setTranslation Swal bootstrap */

function hasTheme (classes) {
  let classNames = classes.value;
  const themesRegex = new RegExp("bg-theme(\\d{2}|\\d{1})", "gm");
  const exec = themesRegex.exec(classNames);
  if (exec) return exec[0];
  return false;
}

function applyNavbarTheme (newTheme) {
  const footer = document.querySelector("footer");
  const sidebar = document.querySelector("#sidebar-wrapper");
  const navbar = document.querySelector(".navbar");
  const menu = document.querySelector(".dropdown-menu");

  let oldTheme = hasTheme(navbar.classList);
  if (oldTheme !== newTheme) {
    footer.classList.remove(oldTheme);
    sidebar.classList.remove(oldTheme);
    navbar.classList.remove(oldTheme);
    menu.classList.remove(oldTheme);
  }

  footer.classList.add("bg-theme", newTheme);
  sidebar.classList.add("bg-theme", newTheme);
  navbar.classList.add("bg-theme", newTheme);
  menu.classList.add("bg-theme", newTheme);
}

function applyBackgroundTheme (newTheme) {
  document.querySelector("body").className = `bg-theme ${newTheme}`;
}

async function UpdateFlagsLanguage (user, from) {
  const LanguageTranslations = await getTranslateGroup(user.language, "Language_");
  if (from) {
    const section = document.getElementById(from);
    section.querySelector("#English").textContent = LanguageTranslations["English"];
    section.querySelector("#French").textContent = LanguageTranslations["French"];
    section.querySelector("#German").textContent = LanguageTranslations["German"];
    section.querySelector("#Italian").textContent = LanguageTranslations["Italian"];
    section.querySelector("#Spanish").textContent = LanguageTranslations["Spanish"];
    section.querySelector("#Dutch").textContent = LanguageTranslations["Dutch"];
    section.querySelector("#Turkish").textContent = LanguageTranslations["Turkish"];
  } else {
    setTranslation("English", LanguageTranslations["English"]);
    setTranslation("French", LanguageTranslations["French"]);
    setTranslation("German", LanguageTranslations["German"]);
    setTranslation("Italian", LanguageTranslations["Italian"]);
    setTranslation("Spanish", LanguageTranslations["Spanish"]);
    setTranslation("Dutch", LanguageTranslations["Dutch"]);
    setTranslation("Turkish", LanguageTranslations["Turkish"]);
  }
}

function FlagsSelector (user, dropdown, input, items) {
  // Get all the dropdown items
  const dropdownLanguageItems = items ? document.getElementById(items).querySelectorAll("a.dropdown-item") : document.querySelectorAll("a.dropdown-item"); // Select the 'a' tag

  // Get the hidden input field
  const selectedLanguageInput = input ? document.getElementById(input) : document.getElementById("selectedLanguage");

  // Get the dropdown button
  const dropdownLanguageButton = dropdown ? document.getElementById(dropdown) : document.getElementById("LanguageButton");

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
}

function UserSelector (user) {
  // Get all the dropdown items
  const dropdownUserItems = document.getElementById("UserSelectorDropdown").querySelectorAll("a.dropdown-item");

  // Get the hidden input field
  const selectedUserInput = document.getElementById("selectedUser");

  // Get the dropdown button
  const dropdownUserButton = document.getElementById("UserSelectButton");

  // --- Set the default user on page load ---
  const defaultUserValue = user.username;
  const defaultUserId = user.id;

  // Find the dropdown item that matches the default user value
  const defaultUserItem = Array.from(dropdownUserItems).find((item) => {
    return item.getAttribute("data-value") === defaultUserValue;
  });

  // If a default item is found, set it as the selected one initially
  if (defaultUserItem) {
    const defaultUserTextElement = defaultUserItem.querySelector("div");
    const defaultUserText = defaultUserTextElement ? defaultUserTextElement.textContent.trim() : "";

    // Update the value of the hidden input field
    if (selectedUserInput) {
      selectedUserInput.value = defaultUserValue;
      selectedUserInput.setAttribute("identifier", defaultUserId);
    }

    // Update the text on the dropdown button
    if (dropdownUserButton) {
      dropdownUserButton.innerHTML = defaultUserText;
    }
  } else {
    console.warn(`Dropdown item with data-value="${defaultUserValue}" not found for default selection.`);
  }

  // Add a click event listener to each dropdown item
  dropdownUserItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();

      // Get the value from the 'data-value' attribute of the clicked 'a' tag
      const selectedUserValue = this.getAttribute("data-value");
      const selectedUserId = this.getAttribute("data-id");

      // Find the div containing the text and get its text content
      const selectedUserTextElement = this.querySelector("div");
      const selectedUserText = selectedUserTextElement ? selectedUserTextElement.textContent.trim() : "";

      // Update the value of the hidden input field
      if (selectedUserInput) {
        selectedUserInput.value = selectedUserValue;
        selectedUserInput.setAttribute("identifier", selectedUserId);
        selectedUserInput.dispatchEvent(new Event("change"));
      }

      // update the text on the dropdown button
      if (dropdownUserButton) {
        dropdownUserButton.innerHTML = selectedUserText;
      }
    });
  });
}

function LevelSelector (user) {
  // Get all the dropdown items
  const dropdownLevelItems = document.getElementById("LevelSelectorDropdown").querySelectorAll("a.dropdown-item");

  // Get the hidden input field
  const selectedLevelInput = document.getElementById("selectedLevel");

  // Get the dropdown button
  const dropdownLevelButton = document.getElementById("LevelButton");

  // --- Set the default user on page load ---
  const defaultLevelValue = user.level.toString();

  // Find the dropdown item that matches the default user value
  const defaultLevelItem = Array.from(dropdownLevelItems).find((item) => {
    return item.getAttribute("data-value") === defaultLevelValue;
  });

  // If a default item is found, set it as the selected one initially
  if (defaultLevelItem) {
    // Update the value of the hidden input field
    if (selectedLevelInput) {
      selectedLevelInput.value = defaultLevelValue;
    }

    // Update the text on the dropdown button
    if (dropdownLevelButton) {
      dropdownLevelButton.innerHTML = defaultLevelValue;
    }
  } else {
    console.warn(`Dropdown item with data-value="${defaultLevelValue}" not found for default selection.`);
  }

  // Add a click event listener to each dropdown item
  dropdownLevelItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();

      // Get the value from the 'data-value' attribute of the clicked 'a' tag
      const selectedLevelValue = this.getAttribute("data-value");

      // Update the value of the hidden input field
      if (selectedLevelInput) {
        selectedLevelInput.value = selectedLevelValue;
      }

      // update the text on the dropdown button
      if (dropdownLevelButton) {
        dropdownLevelButton.innerHTML = selectedLevelValue;
      }
    });
  });
}


window.addEventListener("error", function (event) {
  console.error("[SCRIPT] An error occurred:", event.message);
  console.error("[SCRIPT] Script:", event.filename);
  console.error("[SCRIPT] Line:", event.lineno);
  console.error("[SCRIPT] Column:", event.colno);
  const contentWrapper = document.querySelector(".content-wrapper");
  Swal.fire({
    icon: "error",
    title: "Oops...",
    html: `<div>${event.message}</div><div>Script: ${event.filename}</div><div>Line: ${event.lineno}</div><div>Column: ${event.colno}</div>`,
    confirmButtonText: "Retry",
    showCancelButton: true,
    didOpen: () => {
      if (contentWrapper) contentWrapper.classList.add("blur");
    },
    willClose: () => {
      if (contentWrapper) contentWrapper.classList.remove("blur");
    },
    customClass: {
      confirmButton: "btn btn-primary btn-round me-3",
      cancelButton: "btn btn-dark btn-round"
    },
    allowOutsideClick: false
  }).then((result) => {
    if (result.isConfirmed) {
      location.href = window.location.href;
    }
  });
});

document.addEventListener("Includes_Complete", () => {
  console.log("Execute App-scripts");

  // toggle menu
  const toggleMenu = document.querySelector(".toggle-menu");
  if (toggleMenu) {
    toggleMenu.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("wrapper").classList.toggle("toggled");
      document.querySelector("footer").classList.toggle("toggled");
    });
  }
  const wrapper = document.querySelector("#wrapper");
  const overlay = wrapper.querySelector(".overlay");
  if (overlay) {
    overlay.addEventListener("click", () => {
      wrapper.classList.remove("toggled");
    });
  }

  // scrollTo functionality
  const scrollTo = function (scrollTo) {
    let targetPosition = 0;
    if (typeof scrollTo === "string") {
      const element = document.querySelector(scrollTo);
      if (element) {
        targetPosition = window.pageYOffset + element.getBoundingClientRect().top;
      } else {
        console.error(`error: No element found with the selector ${scrollTo}`);
        return;
      }
    } else if (typeof scrollTo === "number") {
      targetPosition = scrollTo;
    } else {
      console.error("error: Invalid scrollTo value");
      return;
    }

    window.scrollTo({
      top: targetPosition,
      behavior: "smooth"
    });
  };

  // scroll icon
  const backTop = document.querySelector(".back-to-top");
  if (backTop) {
    // Function to check and set backTop visibility
    const checkBackTopVisibility = () => {
      if (document.scrollingElement.scrollTop > 150) {
        backTop.classList.add("show");
      } else {
        backTop.classList.remove("show");
      }
    };

    // Initial check on load
    checkBackTopVisibility();

    // Check visibility on scroll
    window.addEventListener("scroll", checkBackTopVisibility);

    // Check visibility on resize
    window.addEventListener("resize", checkBackTopVisibility);

    // Smooth scroll to top on click
    backTop.onclick = () => scrollTo(0);
  }

  /**
   * --------------------------------------------
   * Fullscreen plugin for AdminLTE based
   * --------------------------------------------
   */
  class FullScreen {
    constructor (element) {
      this._element = element;
    }

    inFullScreen () {
      const event = new Event("maximized.fs.fullscreen");
      const iconMaximize = document.querySelector("[data-fs-icon='maximize']");
      const iconMinimize = document.querySelector("[data-fs-icon='minimize']");
      void document.documentElement.requestFullscreen();
      if (iconMaximize) {
        iconMaximize.style.display = "none";
      }
      if (iconMinimize) {
        iconMinimize.style.display = "block";
      }
      this._element.dispatchEvent(event);
    }

    outFullscreen () {
      const event = new Event("minimized.fs.fullscreen");
      const iconMaximize = document.querySelector("[data-fs-icon='maximize']");
      const iconMinimize = document.querySelector("[data-fs-icon='minimize']");
      void document.exitFullscreen();
      if (iconMaximize) {
        iconMaximize.style.display = "block";
      }
      if (iconMinimize) {
        iconMinimize.style.display = "none";
      }
      this._element.dispatchEvent(event);
    }

    toggleFullScreen () {
      if (document.fullscreenEnabled) {
        if (document.fullscreenElement) {
          this.outFullscreen();
        }
        else {
          this.inFullScreen();
        }
      }
    }
  }

  const fullscreeButtons = document.querySelectorAll("[data-fs-toggle='fullscreen']");
  fullscreeButtons.forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      const target = event.target;
      const button = target.closest("[data-fs-toggle='fullscreen']");
      if (button) {
        const data = new FullScreen(button);
        data.toggleFullScreen();
      }
    });
  });

});

let deferredPrompt;

function hideInstallToast () {
  const toastContainer = document.querySelector(".toast-container");
  if (toastContainer) {
    const displayedToast = toastContainer.querySelector(".toast.show");
    if (displayedToast) {
      const toastInstance = bootstrap.Toast.getInstance(displayedToast);
      if (toastInstance) {
        toastInstance.hide();
      } else {
        displayedToast.classList.remove("show");
        displayedToast.style.display = "none";
      }
    }
  }
}

const handleInstallButtonClick = async (event) => {
  if (deferredPrompt && event.target.classList.contains("install-pwa-button")) {
    event.preventDefault();

    hideInstallToast();

    deferredPrompt.prompt();

    const choiceResult = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${choiceResult.outcome}`);

    deferredPrompt = null;

    document.removeEventListener("click", handleInstallButtonClick);
  }
};

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const toastOptions = {
    header: `
      <div class="d-flex gap-1">
        <span class="text-info">
          <i class="fa-solid fa-circle-info fa-lg"></i>
        </span>
        <span>MMM-Bugsounet<span>
      </div>
    `,
    headerSmall: "Installation Available",
    body: `
      Install the app for a better experience!
      <div class="mt-2 pt-2 border-top">
        <button type="button" class="btn btn-primary btn-sm install-pwa-button">Install</button>
      </div>
    `,
    position: "bottom-0 end-0",
    toastClass: "text-white bg-info bg-gradient",
    animation: true,
    delay: 30000,
    ariaLive: "assertive"
  };

  if (bootstrap && bootstrap.showToast) {
    bootstrap.showToast(toastOptions);
  } else {
    console.warn("Bootstrap showToast function not available.");
  }

  document.addEventListener("click", handleInstallButtonClick);
});

window.addEventListener("appinstalled", () => {
  console.log("PWA was installed");
  hideInstallToast();
});

function DoToast (type, header, small, body) {
  var toastClass, headerIcon;
  switch (type) {
    case "error":
      toastClass = "text-white bg-gradient bg-danger";
      headerIcon = `<div class="d-flex gap-1"><span class="text-danger"><i class="fa-solid fa-times-circle fa-lg"></i></span><span>${header}<span></div>`;
      break;
    case "warning":
      toastClass = "text-white bg-gradient bg-warning";
      headerIcon = `<div class="d-flex gap-1"><span class="text-warning"><i class="fa-solid fa-exclamation-circle fa-lg"></i></span><span>${header}<span></div>`;
      break;
    case "success":
      toastClass = "text-white bg-gradient bg-success";
      headerIcon = `<div class="d-flex gap-1"><span class="text-success"><i class="fa-solid fa-check-circle fa-lg"></i></span><span>${header}<span></div>`;
      break;
    case "info":
      toastClass = "text-white bg-gradient bg-info";
      headerIcon = `<div class="d-flex gap-1"><span class="text-info"><i class="fa-solid fa-circle-info fa-lg"></i></span><span>${header}<span></div>`;
      break;
    default:
      toastClass = type;
      headerIcon = header;
  }

  bootstrap.showToast({
    header: headerIcon,
    headerSmall: small,
    body: body,
    toastClass: toastClass,
    position: "top-0 end-0"
  });
}
