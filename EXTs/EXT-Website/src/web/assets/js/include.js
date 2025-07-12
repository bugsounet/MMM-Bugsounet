/** include HTML file */

document.addEventListener("DOMContentLoaded", async () => {
  console.log("⭐ Start HTML includes");
  await includeHTML();
  console.log("⭐ Finish HTML includes");
  const event = new Event("Includes_Complete");
  document.dispatchEvent(event);
});

async function includeHTML () {
  const elementsToInclude = document.querySelectorAll("[w3-include-html]");
  const includePromises = [];

  for (const elmnt of elementsToInclude) {
    const file = elmnt.getAttribute("w3-include-html");
    if (file) {
      includePromises.push(
        fetch(file)
          .then((response) => {
            if (!response.ok) {
              console.error(`❗Include Error for file: ${file}`, response.status, response.statusText);
              elmnt.innerHTML = `File Include Error: ${file} (${response.status})`;
            }
            return response.text();
          })
          .then((html) => {
            if (html) {
              elmnt.innerHTML = html;
              console.log("✅ File:", file);
            }
          })
          .catch((error) => {
            console.error(`❗Include Error for file: ${file}`, error);
            elmnt.innerHTML = `File Include Error: ${file}`;
          })
          .finally(() => {
            elmnt.removeAttribute("w3-include-html");
            elmnt.setAttribute("id", _file2name(file));
          })
      );
    }
  }

  await Promise.all(includePromises);
}

function _file2name (file) {
  const parts = file.split("/");
  const filenameWithExtension = parts[parts.length - 1];
  if (filenameWithExtension) {
    const nameWithoutDot = filenameWithExtension.replace(".", "-");
    return nameWithoutDot;
  }
  return file;
}
