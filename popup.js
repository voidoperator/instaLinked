document.getElementById("add-variable").addEventListener("click", addVariable);
document.getElementById("generate-message").addEventListener("click", generateMessage);

function establishConnection(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const port = chrome.tabs.connect(tabs[0].id, { name: "popup" });

    port.onDisconnect.addListener(function () {
      if (chrome.runtime.lastError) {
        setTimeout(function () {
          establishConnection(callback);
        }, 500);
      }
    });

    if (callback) {
      callback(port);
    }
  });
}

establishConnection(function (port) {
  port.postMessage({ action: "requestVariables" });

  port.onMessage.addListener(function (response) {
    if (response.action === "variablesResponse") {
      displayVariables(response.variables);
    }
  });
});


function displayVariables(variables) {
  const variablesContainer = document.getElementById("variables-container");
  variablesContainer.innerHTML = ""; // Clear the container

  for (const key in variables) {
    const variableWrapper = document.createElement("div");

    const variableCheckbox = document.createElement("input");
    variableCheckbox.type = "checkbox";
    variableCheckbox.checked = true;
    variableWrapper.appendChild(variableCheckbox);

    const variableLabel = document.createElement("label");
    variableLabel.textContent = key + ":";
    variableWrapper.appendChild(variableLabel);

    const variableInput = document.createElement("input");
    variableInput.type = "text";
    variableInput.value = variables[key];
    variableWrapper.appendChild(variableInput);

    variablesContainer.appendChild(variableWrapper);
  }
}

function addVariable(event) {
  event.preventDefault();
  const variablesContainer = document.getElementById("variables-container");

  const variableWrapper = document.createElement("div");

  const variableCheckbox = document.createElement("input");
  variableCheckbox.type = "checkbox";
  variableWrapper.appendChild(variableCheckbox);

  const variableLabel = document.createElement("input");
  variableLabel.type = "text";
  variableLabel.placeholder = "Variable Name";
  variableWrapper.appendChild(variableLabel);

  const variableInput = document.createElement("input");
  variableInput.type = "text";
  variableInput.placeholder = "Variable Value";
  variableWrapper.appendChild(variableInput);

  variablesContainer.appendChild(variableWrapper);
}


function generateMessage() {
  const variablesContainer = document.getElementById("variables-container");
  const variableWrappers = variablesContainer.querySelectorAll("div");
  const templateMessage = document.getElementById("template-message").value;

  const variables = {};

  variableWrappers.forEach((wrapper) => {
    const checked = wrapper.querySelector("input[type='checkbox']").checked;
    if (checked) {
      const variableName = wrapper.querySelector("label").textContent.replace(":", "");
      const variableValue = wrapper.querySelector("input[type='text']").value;
      variables[variableName] = variableValue;
    }
  });

  chrome.storage.sync.set({ templateMessage }, function () {
    console.log("Template message saved.");
  });

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const port = chrome.tabs.connect(tabs[0].id, { name: "popup" });
    port.postMessage({ action: "generateMessage", variables, templateMessage });
  });
}


// Load the last saved template message
chrome.storage.sync.get("templateMessage", function (data) {
  if (data.templateMessage) {
    document.getElementById("template-message").value = data.templateMessage;
  }
});

