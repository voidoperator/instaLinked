document.addEventListener('DOMContentLoaded', checkIfVariablesAreLoaded);
document.getElementById('add-variable').addEventListener('click', addVariable);
document
  .getElementById('copy-message')
  .addEventListener('click', copyPreviewMessage);
document
  .getElementById('preview-message')
  .addEventListener('click', togglePreview);

document.getElementById('auto-send-message').addEventListener('click', () => {
  const finalTemplateMessage = generateMessage();
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: 'autoSendMessage',
      finalTemplateMessage,
    });
    const handleMessage = (request) => {
      if (request.action === 'autoSendResult') {
        if (request.success) {
          window.close();
        }
        chrome.runtime.onMessage.removeListener(handleMessage);
      }
    };
    chrome.runtime.onMessage.addListener(handleMessage);
  });
});

document.getElementById('reload-variables').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const port = chrome.tabs.connect(tabs[0].id, { name: 'popup' });
    port.postMessage({ action: 'requestVariables' });
    port.onMessage.addListener((response) => {
      if (response.success) {
        displayVariables(response.variables);
      } else {
        console.error('Failed to fetch variables.');
      }
    });
  });
  checkIfVariablesAreLoaded();
});

function establishConnection(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const port = chrome.tabs.connect(tabs[0].id, { name: 'popup' });
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
  port.postMessage({ action: 'requestVariables' });
  port.onMessage.addListener(function (response) {
    if (response.action === 'variablesResponse') {
      chrome.storage.sync.get('customVariables', function (data) {
        const allVariables = { ...response.variables, ...data.customVariables };
        displayVariables(allVariables);
      });
    }
  });
});

function checkIfVariablesAreLoaded() {
  const variablesContainer = document.querySelector('#variables-container');
  const reloadButton = document.querySelector('#reload-wrapper');

  if (variablesContainer.hasChildNodes()) {
    reloadButton.classList.add('hidden');
  } else {
    reloadButton.classList.remove('hidden');
  }
}

function displayVariables(variables) {
  const variablesContainer = document.getElementById('variables-container');
  variablesContainer.innerHTML = '';

  const defaultVariableKeys = [
    'FullName',
    'FirstName',
    'LastName',
    'CompanyName',
    'PositionName',
  ];

  for (const key in variables) {
    const variableWrapper = document.createElement('div');
    variableWrapper.classList.add('var-wrapper');

    // Checkbox
    const variableCheckbox = document.createElement('input');
    variableCheckbox.type = 'checkbox';
    variableCheckbox.checked = true;

    // Checkbox label
    const variableLabel = document.createElement('label');
    variableLabel.textContent = key + ':';

    // Copy template string button
    const copyLabelButton = document.createElement('button');
    copyLabelButton.textContent = 'Copy';
    copyLabelButton.title = 'Copy variable string';
    copyLabelButton.classList.add('copy-var');
    copyLabelButton.addEventListener('click', function () {
      const templateString = variableLabel.innerText.replace(':', '');
      copyToClipboard(`{${templateString}}`);
      copyLabelButton.textContent = 'Copied!';
    });

    // User input field
    const variableInput = document.createElement('input');
    variableInput.type = 'text';
    variableInput.value = variables[key];

    // Copy user input button
    const copyInputButton = document.createElement('button');
    copyInputButton.textContent = 'Copy';
    copyInputButton.title = 'Copy variable value';
    copyInputButton.classList.add('copy-input');
    copyInputButton.addEventListener('click', function () {
      copyToClipboard(variableInput.value);
      copyInputButton.textContent = 'Copied!';
    });

    const variableContainer = document.createElement('div');
    variableContainer.classList.add('variableContainer');
    variableContainer.append(copyLabelButton, variableCheckbox, variableLabel);

    const userInputContainer = document.createElement('div');
    userInputContainer.classList.add('userInputContainer');
    userInputContainer.append(variableInput, copyInputButton);

    variableWrapper.append(variableContainer, userInputContainer);
    variablesContainer.appendChild(variableWrapper);

    // Add remove button for custom variables
    if (!defaultVariableKeys.includes(key)) {
      const removeVariableButton = document.createElement('button');
      removeVariableButton.textContent = ' - ';
      removeVariableButton.addEventListener('click', function () {
        // Remove the variable from the storage
        chrome.storage.sync.get('customVariables', function (data) {
          const customVariables = data.customVariables;
          delete customVariables[key];
          chrome.storage.sync.set({ customVariables }, function () {
            console.log('Variable removed.');
          });
        });

        // Remove the variable from the UI
        variableWrapper.remove();
      });
      variableWrapper.appendChild(removeVariableButton);
    }

    variablesContainer.appendChild(variableWrapper);
  }
  // Check if any variables are loaded and show the reload button if there are none
  checkIfVariablesAreLoaded();
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    console.error('Failed to copy: ', e);
  }
}

function addVariable(event) {
  event.preventDefault();
  const variablesContainer = document.getElementById('variables-container');

  const variableWrapper = document.createElement('div');
  variableWrapper.classList.add('var-wrapper');

  const variableCheckbox = document.createElement('input');
  variableCheckbox.type = 'checkbox';
  variableCheckbox.checked = true;

  // Copy template string button
  const copyLabelButton = document.createElement('button');
  copyLabelButton.textContent = 'Copy';
  copyLabelButton.title = 'Copy variable string';
  copyLabelButton.classList.add('copy-var');
  copyLabelButton.addEventListener('click', function () {
    const templateString = variableLabel.value;
    copyToClipboard(`{${templateString}}`);
    copyLabelButton.textContent = 'Copied!';
  });

  const variableLabel = document.createElement('input');
  variableLabel.type = 'text';
  variableLabel.placeholder = 'Variable Name';
  variableWrapper.appendChild(variableLabel);

  const variableInput = document.createElement('input');
  variableInput.type = 'text';
  variableInput.placeholder = 'Variable Value';

  // Add remove button for the new custom variable
  const removeVariableButton = document.createElement('button');
  removeVariableButton.textContent = ' - ';
  removeVariableButton.classList.add('remove-var-button');
  removeVariableButton.addEventListener('click', function () {
    // Remove the variable from the UI
    variableWrapper.remove();
  });
  const variableContainer = document.createElement('div');
  variableContainer.classList.add('variableContainer');
  variableContainer.append(copyLabelButton, variableCheckbox, variableLabel);

  const userInputContainer = document.createElement('div');
  userInputContainer.classList.add('userInputContainer');
  userInputContainer.append(variableInput, removeVariableButton);

  variableWrapper.append(variableContainer, userInputContainer);
  variablesContainer.appendChild(variableWrapper);
}

function generateMessage() {
  const variablesContainer = document.getElementById('variables-container');
  const variableWrappers =
    variablesContainer.querySelectorAll('div.var-wrapper');
  const templateMessage = document.getElementById('template-message').value;
  let modifiedMessage = templateMessage || '';

  const defaultVariables = {
    FullName: '',
    FirstName: '',
    LastName: '',
    CompanyName: '',
    PositionName: '',
  };
  const customVariables = {};

  variableWrappers.forEach((wrapper) => {
    const checked = wrapper.querySelector(
      ".variableContainer > input[type='checkbox']"
    ).checked;
    let variableName, variableValue;
    if (checked) {
      const labelElement = wrapper.querySelector('.variableContainer label');
      if (labelElement) {
        variableName = wrapper
          .querySelector('label')
          .textContent.replace(':', '');
        variableValue = wrapper.querySelector(
          ".userInputContainer > input[type='text']"
        ).value;
      } else {
        variableName = wrapper.querySelector(
          "input[placeholder='Variable Name']"
        ).value;
        variableValue = wrapper.querySelector(
          "input[placeholder='Variable Value']"
        ).value;
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

  chrome.storage.sync.set({ templateMessage, customVariables }, function () {
    console.log('Template message and custom variables saved.');
  });

  return modifiedMessage;
}

async function copyPreviewMessage() {
  const copyButton = document.getElementById('copy-message');
  const previewMessage = await generateMessage();
  copyToClipboard(previewMessage);
  if (copyButton.textContent === 'Copy Preview') {
    copyButton.textContent = 'Copied!';
  } else {
    copyButton.textContent = 'Copy Preview';
  }
}

let previewVisible = false;

async function togglePreview() {
  const previewBox = document.getElementById('preview-box');
  const previewButton = document.getElementById('preview-message');
  if (!previewBox) {
    const variablesContainer = document.getElementById('root');
    const newPreviewBox = document.createElement('div');
    newPreviewBox.id = 'preview-box';
    const previewText = document.createElement('p');
    previewText.innerText = await generateMessage();
    newPreviewBox.appendChild(previewText);
    variablesContainer.appendChild(newPreviewBox);
    previewButton.textContent = 'Hide Preview';
    previewVisible = true;
  } else {
    if (previewVisible) {
      previewBox.classList.add('hidden');
      previewButton.textContent = 'Preview Message';
      previewVisible = false;
    } else {
      const previewText = previewBox.querySelector('p');
      previewText.innerText = await generateMessage();
      previewBox.classList.remove('hidden');
      previewButton.textContent = 'Hide Preview';
      previewVisible = true;
    }
  }
}

// Load the last saved template message
chrome.storage.sync.get('templateMessage', function (data) {
  if (data.templateMessage) {
    document.getElementById('template-message').value = data.templateMessage;
  }
});
