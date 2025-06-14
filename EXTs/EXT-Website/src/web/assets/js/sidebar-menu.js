document.addEventListener("Includes_Complete", async () => {
  console.log("Execute sidebar-menu");

  const activeLink = Array.from(document.querySelectorAll(".sidebar-menu a")).find(function (link) {
    return link.href === window.location.href;
  });

  if (activeLink) {
    activeLink.classList.add("active");
    let currentElement = activeLink.parentElement;

    while (currentElement) {
      if (currentElement.tagName === "LI") {
        currentElement.classList.add("active");
      }

      if (currentElement.classList.contains("collapse")) {
        currentElement.classList.add("show");
        currentElement.classList.add("active");

        let parentOfCollapse = currentElement.parentElement;
        if (parentOfCollapse && parentOfCollapse.tagName === "LI") {
          parentOfCollapse.classList.add("active");
        }

        let targetDiv = activeLink.parentElement;

        while (targetDiv && !currentElement.contains(targetDiv)) {
          targetDiv = targetDiv.parentElement;
        }

        if (targetDiv && targetDiv.tagName === "DIV") {
          targetDiv.classList.add("rounded-start-5", "mt-1");
        }
      }

      currentElement = currentElement.parentElement;
    }
  }
});
