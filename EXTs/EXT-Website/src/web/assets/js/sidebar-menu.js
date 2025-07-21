/* global bootstrap */

document.addEventListener("Includes_Complete", function () {
  const sidebar = document.getElementById("sidebar-html");
  const contentArea = document.querySelector(".content-container");
  const topbar = document.getElementById("topbar-html");

  if (!sidebar || !contentArea || !topbar) return;

  const initialContentUrl = "/html/home.html";
  var currentLoadedUrl = initialContentUrl;

  async function handleNavigationClick (event) {
    const wrapper = document.getElementById("wrapper");
    const targetLink = event.target.closest("a[data-loading]");

    if (targetLink) {
      const urlToLoad = targetLink.getAttribute("data-loading");

      if (urlToLoad) {
        if (urlToLoad === currentLoadedUrl) {
          console.log(`Content for ${urlToLoad} is already displayed.`);
          if (wrapper.classList.contains("toggled")) {
            wrapper.classList.remove("toggled");
          }
          return;
        }

        if (event.currentTarget === sidebar) {
          if (wrapper.classList.contains("toggled")) {
            wrapper.classList.remove("toggled");
          }
          HilightCurrentLink(targetLink);
        } else if (event.currentTarget === topbar) {
          closeAllHilightLink();
        }

        await loadContentDynamically(urlToLoad, contentArea);

        currentLoadedUrl = urlToLoad;

        const newContentEvent = new Event("NewContent_Loaded");
        document.dispatchEvent(newContentEvent);

      } else {
        console.warn("Clicked link has data-loading attribute but no value:", targetLink);
      }
    }
  }

  sidebar.addEventListener("click", handleNavigationClick);
  topbar.addEventListener("click", handleNavigationClick);

});

async function loadContentDynamically (url, containerElement) {

  const contentContainer = document.querySelector(".content-container");
  const loadingBar = document.getElementById("loading-bar");

  contentContainer.classList.add("is-loading");
  loadingBar.classList.add("is-active");
  loadingBar.style.width = "0%";
  loadingBar.classList.remove("is-complete", "is-error");

  await new Promise((resolve) => setTimeout(resolve, 300));
  containerElement.innerHTML = "";

  try {
    let filenameWithExtension = url;
    const prefix = "/html/";
    if (filenameWithExtension.startsWith(prefix)) {
      filenameWithExtension = filenameWithExtension.substring(prefix.length);
    } else {
      console.warn(`URL does not start with ${prefix}: ${url}. Cannot derive ID based on pattern.`);
    }

    const lastDotIndex = filenameWithExtension.lastIndexOf(".");
    let filename = filenameWithExtension;
    if (lastDotIndex > 0) {
      filename = filenameWithExtension.substring(0, lastDotIndex);
    }

    let cleanedFilename = filename.replace(/\./g, "-");
    if (cleanedFilename === "") cleanedFilename = "default";

    const contentId = `${cleanedFilename}-html`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to load content: ${url} -- Error: ${response.status} (${response.statusText})`);
    }

    const html = await response.text();

    const contentWrapperDiv = document.createElement("div");
    contentWrapperDiv.id = contentId;

    contentWrapperDiv.innerHTML = html;
    containerElement.appendChild(contentWrapperDiv);

  } catch (error) {
    console.error(error);
    loadingBar.classList.add("is-error");
    containerElement.innerHTML = `
      <div class="alert alert-danger d-flex align-items-center justify-self-center" role="alert">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-exclamation-triangle-fill flex-shrink-0 me-2" viewBox="0 0 16 16" role="img" aria-label="Warning:">
          <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
        </svg>
        <div>${error}</div>
      </div>
    `;
    contentContainer.classList.remove("is-loading");

  } finally {
    loadingBar.style.width = "50%";
  }
}

function HilightCurrentLink (activeLink) {
  const sidebar = document.getElementById("sidebar-html");
  if (!sidebar) {
    console.error("Sidebar element #sidebar-html not found.");
    return;
  }

  const previouslyActiveLinks = sidebar.querySelectorAll(".sidebar-menu a.active");

  previouslyActiveLinks.forEach((link) => {
    link.classList.remove("active");

    let currentElement = link.parentElement;
    while (currentElement && currentElement !== sidebar) {

      if (currentElement.tagName === "LI") {
        currentElement.classList.remove("active");

        const collapseElement = currentElement.querySelector(".collapse");
        if (collapseElement) {
          const isNewLinkInsideThisCollapse = activeLink && collapseElement.contains(activeLink);

          if (!isNewLinkInsideThisCollapse) {
            const bsCollapse = bootstrap.Collapse.getInstance(collapseElement);
            if (bsCollapse) {
              bsCollapse.hide();
            } else {
              collapseElement.classList.remove("show");
              const controllingLink = currentElement.querySelector("a[data-bs-toggle=\"collapse\"]");
              if (controllingLink) {
                controllingLink.setAttribute("aria-expanded", "false");
              }
            }
          }

          const allContentDivsInThisCollapse = collapseElement.querySelectorAll(".content-div-class");
          allContentDivsInThisCollapse.forEach((div) => {
            if (div.classList.contains("show")) {
              div.classList.remove("show");
            }
          });

        }

        if (currentElement.classList.contains("rounded-start-5") || currentElement.classList.contains("mt-1")) {
          currentElement.classList.remove("rounded-start-5", "mt-1");
        }

      }

      currentElement = currentElement.parentElement;
    }
  });

  if (activeLink) {
    activeLink.classList.add("active");

    if (activeLink.getAttribute("data-bs-toggle") === "collapse") {
      console.log("it's a collapse data-bs-toggle:", activeLink);
      // ... (your existing logic using bsCollapse.show() for the *target* collapse) ...
      // ... (logic to hide content divs within the newly opened collapse - keep as is) ...
    }

    let currentElement = activeLink.parentElement;
    let parentCollapseElement = null;

    while (currentElement && currentElement !== sidebar) {

      if (currentElement.tagName === "LI") {
        currentElement.classList.add("active");
      }

      if (currentElement.classList.contains("collapse")) {
        parentCollapseElement = currentElement;

        currentElement.classList.add("active");

        const collapseId = currentElement.id;
        if (collapseId) {
          const linkControllingThisCollapse = sidebar.querySelector(`a[data-bs-target="#${collapseId}"], a[href="#${collapseId}"]`);
          if (linkControllingThisCollapse) {
            linkControllingThisCollapse.setAttribute("aria-expanded", "true");
            linkControllingThisCollapse.classList.remove("collapsed");
          }
        }

        let parentOfCollapse = currentElement.parentElement;
        if (parentOfCollapse && parentOfCollapse.tagName === "LI") {
          parentOfCollapse.classList.add("active");
        }

      }

      let targetDiv = activeLink.parentElement;
      let foundTargetDiv = null;
      while (targetDiv && targetDiv !== sidebar) {
        if (parentCollapseElement && parentCollapseElement.contains(targetDiv) && targetDiv.tagName === "DIV") {
          foundTargetDiv = targetDiv;
          break;
        }
        targetDiv = targetDiv.parentElement;
      }

      if (foundTargetDiv) {
        foundTargetDiv.classList.add("rounded-start-5", "mt-1");
      }

      currentElement = currentElement.parentElement;
    }

    if (parentCollapseElement) {
      const targetContentDivSelector = activeLink.getAttribute("data-target-content-div");
      if (targetContentDivSelector) {
        const targetContentDiv = parentCollapseElement.querySelector(targetContentDivSelector);
        if (targetContentDiv) {
          const allContentDivsInThisCollapse = parentCollapseElement.querySelectorAll(".content-div-class");
          allContentDivsInThisCollapse.forEach((div) => {
            div.classList.remove("show");
            div.classList.remove("active");
          });

          targetContentDiv.classList.add("show");
          targetContentDiv.classList.add("active");
        } else {
          console.warn(`Target content div not found for selector: ${targetContentDivSelector}`);
        }
      } else {
        console.warn("Active link does not have a 'data-target-content-div' attribute.");
      }
    }

  }
}

function closeAllHilightLink () {
  const sidebar = document.getElementById("sidebar-html");
  if (!sidebar) {
    console.error("Sidebar element #sidebar-html not found.");
    return;
  }

  const allActiveElements = sidebar.querySelectorAll(".sidebar-menu a.active, .sidebar-menu li.active");
  allActiveElements.forEach((element) => {
    element.classList.remove("active");
  });

  const allCollapseElements = sidebar.querySelectorAll(".collapse.show");
  allCollapseElements.forEach((collapseElement) => {
    const bsCollapse = bootstrap.Collapse.getInstance(collapseElement);
    if (bsCollapse) {
      bsCollapse.hide();
    } else {
      collapseElement.classList.remove("show");
      const controllingLink = collapseElement.parentElement.querySelector("a[data-bs-toggle=\"collapse\"]");
      if (controllingLink) {
        controllingLink.setAttribute("aria-expanded", "false");
        controllingLink.classList.add("collapsed"); // Also add 'collapsed' class
      }
    }
  });

  const allContentDivs = sidebar.querySelectorAll(".content-div-class.show, .content-div-class.active");
  allContentDivs.forEach((div) => {
    div.classList.remove("show");
    div.classList.remove("active");
  });

  const allRoundedMtElements = sidebar.querySelectorAll(".sidebar-menu li.rounded-start-5, .sidebar-menu li.mt-1");
  allRoundedMtElements.forEach((element) => {
    element.classList.remove("rounded-start-5", "mt-1");
  });
}
