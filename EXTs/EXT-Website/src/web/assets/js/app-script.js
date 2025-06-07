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
  const scrollTo = function (scrollTo, scrollDuration) {
    var To = scrollTo;
    var Duration = scrollDuration;
    //
    // Set a default for where we're scrolling to
    //

    if (typeof To === "string") {

      // Assuming this is a selector we can use to find an element
      var scrollToObj = document.querySelector(To);

      if (scrollToObj && typeof scrollToObj.getBoundingClientRect === "function") {
        To = window.pageYOffset + scrollToObj.getBoundingClientRect().top;
      } else {
        console.error(`error: No element found with the selector ${To}`);
      }
    } else if (typeof To !== "number") {

      // If it's nothing above and not an integer, we assume top of the window
      To = 0;
    }

    // Set this a bit higher

    var anchorHeightAdjust = 30;
    if (To > anchorHeightAdjust) {
      To = To - anchorHeightAdjust;
    }

    if (typeof Duration !== "number" || Duration < 0) {
      Duration = 1000;
    }

    // Declarations
    var cosParameter = (window.pageYOffset - To) / 2,
      scrollCount = 0,
      oldTimestamp = window.performance.now();

    function step (newTimestamp) {
      var tsDiff = newTimestamp - oldTimestamp;

      // Performance.now() polyfill loads late so passed-in timestamp is a larger offset
      // on the first go-through than we want so I'm adjusting the difference down here.
      // Regardless, we would rather have a slightly slower animation than a big jump so a good
      // safeguard, even if we're not using the polyfill.

      if (tsDiff > 100) {
        tsDiff = 30;
      }

      scrollCount += Math.PI / (Duration / tsDiff);

      // As soon as we cross over Pi, we're about where we need to be

      if (scrollCount >= Math.PI) {
        return;
      }

      var moveStep = Math.round(To + cosParameter + cosParameter * Math.cos(scrollCount));
      window.scrollTo(0, moveStep);
      oldTimestamp = newTimestamp;
      window.requestAnimationFrame(step);
    }

    window.requestAnimationFrame(step);
  };

  // scroll icon
  const backTop = document.querySelector(".back-to-top");
  if (backTop) {
    window.addEventListener("scroll", () => {
      if (document.scrollingElement.scrollTop > 300) {
        backTop.style.opacity = 1;
      } else {
        backTop.style.opacity = 0;
      }
    });
    backTop.onclick = () => scrollTo(0, 600);
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

  /* not used actually */
  /*
  $(function() {
    "use strict";
    $.sidebarMenu($('.sidebar-menu'));
    $(function () {
      $('[data-toggle="popover"]').popover()
    })

    $(function () {
      $('[data-toggle="tooltip"]').tooltip()
    })
  });
  */
});
