// Catalog Client Script: CheckBrowser
// sys_id: c7ddff67973cea10cc1ebbdfe153afe0
// type: onLoad

function onLoad() {
  try {
    var userAgent = navigator.userAgent;
	var mensaje ="es posible que la solicitud no sea creada de manera adecuada, favor de utiliza Google Chrome, Firefox, Opera";

    if (userAgent.indexOf("MSIE ") > -1 || userAgent.indexOf("Trident/") > -1) {
      reedirectChrome("Estás usando Internet Explorer, " + mensaje);
    } else if (userAgent.indexOf("Edge/") > -1) {
      reedirectChrome("Estás usando Microsoft Edge (Legacy), "+mensaje);
    } else if (userAgent.indexOf("Edg/") > -1) {
      reedirectChrome("Estás usando Microsoft Edge (Chromium), "+mensaje);
    }
  } catch (e) {
    console.error("Error detectando el navegador:", e);
  }
}

function reedirectChrome(mensaje){
	alert(mensaje);
   top.window.location.replace("https://www.google.com/intl/es_us/chrome/");
}