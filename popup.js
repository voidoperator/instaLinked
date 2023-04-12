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
      chrome.storage.sync.get("customVariables", function (data) {
        const allVariables = { ...response.variables, ...data.customVariables };
        displayVariables(allVariables);
      });
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

    // Copy template string
    const copyLabelButton = document.createElement("button");
    copyLabelButton.textContent = "Copy";
    copyLabelButton.addEventListener("click", function () {
      const templateString = variableLabel.innerText.replace(":", "");
      copyToClipboard(`{${templateString}}`);
      copyLabelButton.textContent = "Copied!"
    });
    variableWrapper.appendChild(variableLabel);
    variableWrapper.appendChild(copyLabelButton);

    const variableInput = document.createElement("input");
    variableInput.type = "text";
    variableInput.value = variables[key];
    variableWrapper.appendChild(variableInput);

    // Copy user input
    const copyInputButton = document.createElement("button");
    copyInputButton.textContent = "Copy";
    copyInputButton.addEventListener("click", function () {
      copyToClipboard(variableInput.value);
      copyInputButton.textContent = "Copied!"
    });
    variableWrapper.appendChild(copyInputButton);

    variablesContainer.appendChild(variableWrapper);
  }
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    console.eor("Failed to copy variable: ", err);
  }
}


function addVariable(event) {
  event.preventDefault();
  const variablesContainer = document.getElementById("variables-container");

  const variableWrapper = document.createElement("div");

  const variableCheckbox = document.createElement("input");
  variableCheckbox.type = "checkbox";
  variableCheckbox.checked = true;
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
  let modifiedMessage = templateMessage || "";

  const defaultVariables = {
    TheirFullName: "",
    TheirFirstName: "",
    TheirLastName: "",
    TheirCompanyName: "",
    TheirPositionName: "",
  };
  const customVariables = {};

  variableWrappers.forEach((wrapper) => {
    const checked = wrapper.querySelector("input[type='checkbox']").checked;
    let variableName, variableValue;
    if (checked) {
      const labelElement = wrapper.querySelector("label")
      if (labelElement) {
        variableName = wrapper.querySelector("label").textContent.replace(":", "");
        variableValue = wrapper.querySelector("input[type='text']").value;
      } else {
        variableName = wrapper.querySelector("input[placeholder='Variable Name']").value;
        variableValue = wrapper.querySelector("input[placeholder='Variable Value']").value;
      }
      // Replace all occurrences of the variable in the template message
      const variablePattern = new RegExp(`{${variableName}}`, 'g');
      modifiedMessage = modifiedMessage.replace(variablePattern, variableValue);
      // Save custom variables
      if (!Object.keys(defaultVariables).includes(variableName)) {
        customVariables[variableName] = variableValue;
      }
    }
  });

  console.log('modifiedMessage', modifiedMessage)

  chrome.storage.sync.set({ templateMessage, customVariables }, function () {
    console.log("Template message and custom variables saved.");
  });
}

// Load the last saved template message
chrome.storage.sync.get("templateMessage", function (data) {
  if (data.templateMessage) {
    document.getElementById("template-message").value = data.templateMessage;
  }
});

