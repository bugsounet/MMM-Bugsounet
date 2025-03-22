/** Login
* @bugsounet
**/

/* global $, setTranslation, loadLoginTranslation, alertify */

// define all vars
var translation = {};

// Load rules
window.addEventListener("load", async () => {
  translation = await loadLoginTranslation();
  doLogin();
});

function doLogin () {
  $("#Login-submit").addClass("disabled");
  document.title = translation.welcome;
  setTranslation("Welcome", translation.welcome);
  $("#username").attr("placeholder", translation.username);
  $("#password").attr("placeholder", translation.password);
  setTranslation("Login-submit", translation.login);

  $("#login").on("input change", function () {
    if ($("#username").val() !== "" && $("#password").val() !== "") $("#Login-submit").removeClass("disabled");
    else $("#Login-submit").addClass("disabled");
  });

  $("#login").submit(function (event) {
    event.preventDefault();
    alertify.set("notifier", "position", "top-center");

    let credentials = `${$("#username").val()}:${$("#password").val()}`;
    let encode = btoa(credentials);
    Request("/auth", "POST", { Authorization: `Basic ${encode}` }, null, "Login", (response) => {
      localStorage.setItem("MMM-Bugsounet", JSON.stringify(response.session));
      $(location).attr("href", "/");
    }, (err) => {
      $("#username").val("");
      $("#password").val("");
      let error = err.responseJSON?.error ? err.responseJSON.error : (err.responseText ? err.responseText : err.statusText);
      let description = err.responseJSON?.description;
      if (!err.status) alertify.error("Connexion Lost!");
      else if (err.status === 403 || err.status === 401) alertify.error(`[Login] ${error}: ${description}`);
      else alertify.error(`[Login] Server return Error ${err.status} (${error})`);
    });
  });
}
