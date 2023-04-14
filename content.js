chrome.runtime.onConnect.addListener(function (port) {
  if (port.name === 'popup') {
    port.onMessage.addListener(function (request) {
      if (request.action === 'requestVariables') {
        checkProfileAndProcess(port);
      }
    });
  }
});

function checkProfileAndProcess(port = null) {
  const currentURL = window.location.href;
  const profileURLPattern = /^https:\/\/www\.linkedin\.com\/in\/[^/]+\/?$/;
  if (profileURLPattern.test(currentURL)) {
    const variables = {
      FullName: '',
      FirstName: '',
      LastName: '',
      CompanyName: '',
      PositionName: '',
    };
    const extractedVariables = extractVariables(variables);
    if (port) {
      port.postMessage({
        success: true,
        action: 'variablesResponse',
        variables: extractedVariables,
      });
    }
  } else {
    if (port) {
      port.postMessage({
        success: false,
        action: 'variablesResponse',
        variables: {},
      });
    }
  }
}

chrome.runtime.onMessage.addListener(async (request) => {
  if (request.action === 'autoSendMessage') {
    const success = await autoSendMessage(request.finalTemplateMessage);
    chrome.runtime.sendMessage({ action: 'autoSendResult', success });
    return true;
  }
});

function extractVariables(variables) {
  const userNameElement = document.querySelector(
    '.pv-text-details__left-panel > div:first-child > h1'
  );
  if (userNameElement) {
    const fullName = userNameElement.innerText.trim();
    const cleanName = fullName.replace(/\(.*?\)/g, '');
    const cleanerName = cleanName.replace(/[^a-zA-Z\s]+|(\b[A-Z]+\b)/g, '');
    const finalName = cleanerName.replace(/\s+/g, ' ').trim();

    const firstName = finalName.split(' ')[0];
    const lastName = finalName.split(' ')[1];

    variables.FullName = finalName;
    variables.FirstName = firstName;
    variables.LastName = lastName;
  }

  const experienceSectionElement =
    document.getElementById('experience').nextElementSibling.nextElementSibling;
  if (experienceSectionElement) {
    const companyElement = document.querySelector(
      'a[data-field="experience_company_logo"] > div > div > img'
    );
    if (companyElement) {
      variables.CompanyName = companyElement.alt
        .split(' ')
        .slice(0, -1)
        .join(' ');
    }
    const positionElement = experienceSectionElement.querySelector(
      'ul.pvs-list > li > div > div:nth-child(2) > div > div > div > span > span:first-child'
    );
    if (positionElement) {
      variables.PositionName = positionElement.innerText;
    }
  }

  return variables;
}

async function autoSendMessage(finalTemplateMessage) {
  const connectButton = document.querySelector('li-icon[type="connect"]');
  let textAreaCheck;
  try {
    await connectButton.click();
    const addANote = await waitForElement('button[aria-label="Add a note"]');
    addANote.click();
    const noteTextArea = await waitForElement('textarea[id="custom-message"]');
    noteTextArea.value = finalTemplateMessage;
    noteTextArea.dispatchEvent(new Event('input', { bubbles: true }));
    textAreaCheck = noteTextArea;
  } catch (error) {
    console.log('Oops something went wrong: ', error);
  }
  return new Promise((resolve) => {
    if (textAreaCheck.value.length > 0) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
}

function waitForElement(selector) {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element && !element.disabled && element.offsetParent !== null) {
      resolve(element);
    }
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        const nodes = Array.from(mutation.addedNodes);
        for (const node of nodes) {
          if (
            node.matches &&
            node.matches(selector) &&
            !node.disabled &&
            node.offsetParent !== null
          ) {
            observer.disconnect();
            resolve(node);
          }
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'requestVariables') {
    checkProfileAndProcess(sendResponse);
    return true;
  }
});

window.addEventListener('popstate', function () {
  const currentURL = window.location.href;
  const profileURLPattern = /^https:\/\/www\.linkedin\.com\/in\/[^/]+\/?$/;

  if (profileURLPattern.test(currentURL)) {
    checkProfileAndProcess();
  }
});
