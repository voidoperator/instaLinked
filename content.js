chrome.runtime.onConnect.addListener(function (port) {
  if (port.name === "popup") {
    port.onMessage.addListener(function (request) {
      if (request.action === "requestVariables") {
        const variables = {
          TheirFullName: "",
          TheirFirstName: "",
          TheirLastName: "",
          TheirCompanyName: "",
          TheirPositionName: "",
        };
        const extractedVariables = extractVariables(variables);
        port.postMessage({ action: "variablesResponse", variables: extractedVariables });
      }
    });
  }
});

function extractVariables(variables) {
  const userNameElement = document.querySelector(".pv-text-details__left-panel > div:first-child > h1");
  if (userNameElement) {
    const fullName = userNameElement.innerText.trim();
    const firstName = fullName.split(" ")[0];
    const lastName = fullName.split(" ")[1];

    variables.TheirFullName = fullName;
    variables.TheirFirstName = firstName;
    variables.TheirLastName = lastName;
  }

  const experienceSectionElement = document.getElementById('experience').nextElementSibling.nextElementSibling;
  if (experienceSectionElement) {
    const companyElement = document.querySelector('a[data-field="experience_company_logo"] > div > div > img');
    if (companyElement) {
      variables.TheirCompanyName = companyElement.alt.split(' ').slice(0, -1).join(' ');
    }
    const positionElement = experienceSectionElement.querySelector('ul.pvs-list > li > div > div:nth-child(2) > div > div > div > span > span:first-child');
    if (positionElement) {
      variables.TheirPositionName = positionElement.innerText;
    }
  }

  return variables;
}
