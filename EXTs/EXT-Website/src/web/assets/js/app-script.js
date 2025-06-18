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

window.addEventListener("error", function (event) {
  console.error("[SCRIPT] An error occurred:", event.message);
  console.error("[SCRIPT] Script:", event.filename);
  console.error("[SCRIPT] Line:", event.lineno);
  console.error("[SCRIPT] Column:", event.colno);
});

document.addEventListener("Includes_Complete", () => {
  console.log("Execute App-scripts");

  /* themes setting */
  let account = document.getElementById("account-html");
  if (account) {
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
  }

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
