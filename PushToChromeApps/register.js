var registrationId = "";
var hubName = "", connectionString = "";
var originalUri = "", targetUri = "", endpoint = "", sasKeyName = "", sasKeyValue = "", sasToken = "";
var hub = function () { };

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

function setUp() {

  hubName = document.getElementById("hubName").value.trim();
  connectionString = document.getElementById("connectionString").value.trim();
  splitConnectionString();
  generateSaSToken();

  hub = notificationHub({
    hubDomainUri: originalUri,
    log: updateLog
  });
}

function registerWithNH() {
  setUp();
  hub.register(registrationId);
}

function getRegistrationsFromNH() {
  setUp();
  var registrations = hub.getRegistrations({
    callback: displayRegistrations
  });
}

function displayRegistrations(registrationsXml) { 
  updateLog(registrationsXml);

  //todo: read xml and display data in a format
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

function parseXmlString(xmlStr, callback) {

  var parseXml;

  if (typeof window.DOMParser != "undefined") {
    parseXml = function (xmlStr) {
      return (new window.DOMParser()).parseFromString(xmlStr, "text/xml");
    };
  } else if (typeof window.ActiveXObject != "undefined" &&
    new window.ActiveXObject("Microsoft.XMLDOM")) {
    parseXml = function (xmlStr) {
      var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
      xmlDoc.async = "false";
      xmlDoc.loadXML(xmlStr);
      return xmlDoc;
    };
  } else {
    throw new Error("No XML parser found");
  }

  callback(parseXml());
}