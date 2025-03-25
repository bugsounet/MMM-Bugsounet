/** Login
* @bugsounet
**/

/* global setTranslation, loadLoginTranslation, alertify */

// define all vars
var translation = {};

// Load rules
window.addEventListener("load", async () => {
  translation = await loadLoginTranslation();
  doLogin();
});

function doLogin () {
  document.getElementById("Login-submit").classList.add("disabled");
  document.title = translation.welcome;
  setTranslation("Welcome", translation.welcome);
  document.getElementById("username").setAttribute("placeholder", translation.username);
  document.getElementById("password").setAttribute("placeholder", translation.password);
  setTranslation("Login-submit", translation.login);

  const button = document.getElementById("login");
  button.addEventListener("change", function () {
    if (document.getElementById("username").value !== "" && document.getElementById("password").value !== "") {
      document.getElementById("Login-submit").classList.remove("disabled");
    } else {
      document.getElementById("Login-submit").classList.add("disabled");
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
      else if (err.status === 403 || err.status === 401) alertify.error(`[Login] ${error}: ${description}`);
      else alertify.error(`[Login] Server return Error ${err.status} (${error})`);
    });
  });
}
