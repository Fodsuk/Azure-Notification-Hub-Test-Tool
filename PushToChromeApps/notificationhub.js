function notificationHub(dataObj) {

    var _hubDomainUri = dataObj.hubDomainUri;
    var _log = dataObj.log;
    var _apiVersion = "2014-09";

    function register(GCMRegistrationId) {
        
        var registrationId = GCMRegistrationId;
        var registrationPayload =
            "<?xml version=\"1.0\" encoding=\"utf-8\"?>" +
            "<entry xmlns=\"http://www.w3.org/2005/Atom\">" +
            "<content type=\"application/xml\">" +
            "<GcmRegistrationDescription xmlns:i=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns=\"http://schemas.microsoft.com/netservices/2010/10/servicebus/connect\">" +
            "<GcmRegistrationId>{GCMRegistrationId}</GcmRegistrationId>" +
            "</GcmRegistrationDescription>" +
            "</content>" +
            "</entry>";

        registrationPayload = registrationPayload.replace("{GCMRegistrationId}", registrationId);

        var url = _hubDomainUri + "/registrations/?api-version=" + _apiVersion;
        var client = new XMLHttpRequest();

        _log(registrationPayload);
        _log(url);

        client.onload = function () {
            if (client.readyState == 4) {
                if (client.status == 200) {
                    _log("Notification Hub Registration succesful!");
                    _log(client.responseText);
                } else {
                    _log("Notification Hub Registration did not succeed!");
                    _log("HTTP Status: " + client.status + " : " + client.statusText);
                    _log("HTTP Response: " + "\n" + client.responseText);
                }
            }
        };

        client.onerror = function () {
            _log("ERROR - Notification Hub Registration did not succeed!");
        }

        client.open("POST", url, true);
        client.setRequestHeader("Content-Type", "application/atom+xml;type=entry;charset=utf-8");
        client.setRequestHeader("Authorization", sasToken);
        client.setRequestHeader("x-ms-version", "2014-09");

        try {
            client.send(registrationPayload);
        }
        catch (err) {
            _log(err.message);
        }
    }

function getRegistrations() {

  var url = _hubDomainUri + "/registrations/?api-version=" + _apiVersion;
  var client = new XMLHttpRequest();

  client.onload = function () {
    if (client.readyState == 4) {
      if (client.status == 200) {
        _log("Retrieved Notification Hub Registrations succesfully!");
        _log(client.responseText);
      } else {
        _log("Retrieved Notification Hub Registrations did not succeed!");
        _log("HTTP Status: " + client.status + " : " + client.statusText);
        _log("HTTP Response: " + "\n" + client.responseText);
      }
    }
  };

  client.onerror = function () {
    _log("ERROR - Retrieved Notification Hub Registrations did not succeed!");
  }

  client.open("GET", url, true);
  client.setRequestHeader("Content-Type", "application/atom+xml;type=entry;charset=utf-8");
  client.setRequestHeader("Authorization", sasToken);
  client.setRequestHeader("x-ms-version", "2014-09");

  try {
    client.send();
  }
  catch (err) {
    _log(err.message);
  }
}

    return {
        register: register,
        getRegistrations : getRegistration
    };

};