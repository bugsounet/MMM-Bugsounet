function showPopup (message, type, inputs) {
  const popup = document.getElementById("popup");
  popup.innerHTML = `
    <div class="icon ${type}">
      ${type === "success" ? "✔" : "✖"}
    </div>
    <p>${message}</p>
    <button id="popupClose">Close</button>
  `;
  popup.classList.remove("hidden");

  document.getElementById("popupClose").addEventListener("click", () => {
    popup.classList.add("hidden");
    if (inputs) {
      inputs.forEach((input) => {
        input.value = "";
        input.classList.remove("success", "error");
      });
      inputs[0].focus();
    }

  });
}

document.addEventListener("DOMContentLoaded", () => {
  const searchParams = new URLSearchParams(window.location.search);
  var id = null;
  if (searchParams.has("id")) id = searchParams.get("id");

  const appContainer = document.getElementById("app");

  if (!id) {
    appContainer.remove();
    return showPopup("Error: Bad request", "error");
  }

  appContainer.innerHTML = `
    <h1>MMM-Bugsounet API</h1>
    <h2>Administrator account activator</h2>
    <label for="accountName">Enter code:</label>
    <div class="code-container">
      ${Array(6)
        .fill("<input type='number' min='0' max='9' class='code-input' />")
        .join("")}
    </div>
  `;

  const inputs = document.querySelectorAll(".code-input");
  inputs.forEach((input, index) => {
    input.addEventListener("input", (e) => handleInput(e, inputs, index));
    input.addEventListener("keydown", (e) => handleBackspace(e, inputs, index));
  });

  function handleInput (event, inputs, index) {
    const input = event.target;
    const nextInput = inputs[index + 1];

    input.value = input.value.replace(/\D/g, "");

    if (input.value.length > 1) {
      input.value = input.value.slice(-1);
    }

    if (input.value.length > 0 && nextInput) {
      nextInput.focus();
    }

    const codeValue = Array.from(inputs)
      .map((i) => i.value)
      .join("");

    if (codeValue.length === inputs.length) {
      verifyCode(id, codeValue, inputs);
      input.blur();
    }
  }

  // Handle backspace in code input
  function handleBackspace (event, inputs, index) {
    if (event.key === "Backspace" && !inputs[index].value && index > 0) {
      inputs[index - 1].focus();
    }
  }

  // Verify Code
  function verifyCode (id, token, inputs) {
    fetch("/activate/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, token })
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to verify code.");
        return response.json();
      })
      .then((data) => {
        if (data.isValid) {
          showPopup(`Your ${data.account} Account is now active.`, "success");
          updateInputsState(inputs, "success");
          appContainer.remove();
        } else {
          showPopup("This code is invalid.", "error", inputs);
          updateInputsState(inputs, "error");
        }
      })
      .catch((error) => showPopup(`Error: ${error.message}`, "error"));
  }

  // Update the state of Code inputs
  function updateInputsState (inputs, state) {
    inputs.forEach((input) => {
      input.classList.remove("success", "error");
      input.classList.add(state);
    });
  }
});
