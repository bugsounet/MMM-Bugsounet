/** include HTML file from w3-include-html */

document.addEventListener("DOMContentLoaded", async () => {
  console.log("⭐ Start HTML includes");
  await _include2HTML();
  console.log("⭐ Finish HTML includes");
  const event = new Event("Includes_Complete");
  document.dispatchEvent(event);
});

function _include2HTML () {
  return new Promise((resolve) => {
    var z, i, elmnt, file, xhttp;
    z = document.getElementsByTagName("*");
    for (i = 0; i < z.length; i++) {
      elmnt = z[i];
      file = elmnt.getAttribute("w3-include-html");
      if (file) {
        xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = async function () {
          if (this.readyState === 4) {
            if (this.status === 200) {
              elmnt.innerHTML = this.responseText;
              console.log("✅ File:", file);
            }
            if (this.status === 404 || this.status === 0) {
              elmnt.innerHTML = `File Include Error: ${file}`;
              console.error("❗Include Error for file:", file);
            }
            elmnt.removeAttribute("w3-include-html");
            elmnt.setAttribute("id", _file2name(file));
            await _include2HTML();
            resolve();
          }
        };
        xhttp.open("GET", file, true);
        xhttp.send();
        return;
      }
    }
    resolve();
  });
}

function _file2name (file) {
  const regexp = /[^/]*$/g;
  const re = new RegExp(regexp);
  const res = re.exec(file);
  if (res[0]) {
    const name = res[0].replace(".", "-");
    return name;
  }
  return file;
}
