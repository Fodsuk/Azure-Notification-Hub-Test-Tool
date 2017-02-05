var registrationId = "";
var hubName = "", connectionString = "";
var originalUri = "", targetUri = "", endpoint = "", sasKeyName = "", sasKeyValue = "", sasToken = "";


window.onload = function () {
  document.getElementById("registerWithGCM").onclick = registerWithGCM;
  document.getElementById("registerWithNH").onclick = registerWithNH;
  document.getElementById("getRegistrationsFromNH").onclick = getRegistrationsFromNH;
  updateLog("You have not registered yet. Please provider sender ID and register with GCM and then Notifications Hub.");
}

function updateLog(status) {
  currentStatus = document.getElementById("console").innerHTML;
  if (currentStatus != "") {
    currentStatus = currentStatus + "\n\n";
  }

  document.getElementById("console").innerHTML = currentStatus + status;
}

function registerWithGCM() {
  var senderId = document.getElementById("senderId").value.trim();
  chrome.gcm.register([senderId], registerCallback);

  // Prevent register button from being clicked again before the registration finishes
  document.getElementById("registerWithGCM").disabled = true;
}


function registerCallback(regId) {
  registrationId = regId;
  document.getElementById("registerWithGCM").disabled = false;

  if (chrome.runtime.lastError) {
    // When the registration fails, handle the error and retry the
    // registration later.
    updateLog("Registration failed: " + chrome.runtime.lastError.message);
    return;
  }

  updateLog("Registration with GCM succeeded.");
  document.getElementById("registerWithNH").disabled = false;
  document.getElementById("getRegistrationsFromNH").disabled = false;

  // Mark that the first-time registration is done.
  chrome.storage.local.set({ registered: true });
}

function setUpSaSToken() {
  hubName = document.getElementById("hubName").value.trim();
  connectionString = document.getElementById("connectionString").value.trim();
  splitConnectionString();
  generateSaSToken();
}

function registerWithNH() {
  setUpSaSToken();

  var hub = notificationHub({
    hubDomainUri: originalUri,
    log: updateLog
  });

  hub.register(registrationId);

}

function getRegistrationsFromNH() {
  setUpSaSToken();

  var hub = notificationHub({
    hubDomainUri: originalUri,
    log: updateLog
  });

  hub.getRegistrations();
}


// From http://msdn.microsoft.com/en-us/library/dn495627.aspx 
function splitConnectionString() {
  var parts = connectionString.split(';');
  if (parts.length != 3)
    throw "Error parsing connection string";

  parts.forEach(function (part) {
    if (part.indexOf('Endpoint') == 0) {
      endpoint = 'https' + part.substring(11);
    } else if (part.indexOf('SharedAccessKeyName') == 0) {
      sasKeyName = part.substring(20);
    } else if (part.indexOf('SharedAccessKey') == 0) {
      sasKeyValue = part.substring(16);
    }
  });

  originalUri = endpoint + hubName;
}

function generateSaSToken() {
  targetUri = encodeURIComponent(originalUri.toLowerCase()).toLowerCase();
  var expiresInMins = 10; // 10 minute expiration

  // Set expiration in seconds
  var expireOnDate = new Date();
  expireOnDate.setMinutes(expireOnDate.getMinutes() + expiresInMins);
  var expires = Date.UTC(expireOnDate.getUTCFullYear(), expireOnDate
    .getUTCMonth(), expireOnDate.getUTCDate(), expireOnDate
      .getUTCHours(), expireOnDate.getUTCMinutes(), expireOnDate
        .getUTCSeconds()) / 1000;
  var tosign = targetUri + '\n' + expires;

  // using CryptoJS
  var signature = CryptoJS.HmacSHA256(tosign, sasKeyValue);
  var base64signature = signature.toString(CryptoJS.enc.Base64);
  var base64UriEncoded = encodeURIComponent(base64signature);

  // construct authorization string
  sasToken = "SharedAccessSignature sr=" + targetUri + "&sig="
    + base64UriEncoded + "&se=" + expires + "&skn=" + sasKeyName;
}

