

/*
sequence: 
send panel 6 request
send "back button" 
send panel 2 "AllFutre" request
send "back button"
*/

// this is global so we can recycle it
let xhr = new XMLHttpRequest();
let popupCallback;
let pastResContent, futureResContent;

function sendRequest(options) {
  form = document.getElementById(options.formId);
  let formData = new FormData(form)
  for ([key, value] of options.extraFormData) {
    formData.append(key, value)
  }
  const queryString = new URLSearchParams(formData).toString()

  xhr.open("POST", options.url)
  xhr.onreadystatechange = options.callback;
  xhr.responseType = "document"
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded;charset=UTF-8");
  xhr.setRequestHeader("Faces-Request", "partial/ajax")
  xhr.send(queryString)
}

function sendHistoryRequest() {
  let options = {
    url: "https://mercuryweb.berkeley.edu/MercuryWeb/faces/pages/reserve/Reservations.xhtml",
    formId: "panelSixForm",
    extraFormData: [
      ["javax.faces.partial.execute", "@all"],
      ["ice.event.captured", "panelSixForm:memberOwnLink"]
    ],
    callback: historyReturned
  }
  sendRequest(options)
}

function sendFirstBackRequest() {
  let options = {
    url: "https://mercuryweb.berkeley.edu/MercuryWeb/faces/pages/reserve/ReservationView.xhtml",
    formId: "buttonsForm",
    extraFormData: [
      ["javax.faces.partial.execute", "@all"]
      ["ice.event.captured", "buttonsForm:backButton"]
    ],
    callback: firstBackReturned
  }
  sendRequest(options)
}

function sendFutureRequest() {
  let options = {
    url: "https://mercuryweb.berkeley.edu/MercuryWeb/faces/pages/reserve/Reservations.xhtml",
    formId: "panelSixForm",
    extraFormData: [
      ["javax.faces.partial.execute", "@all"],
      ["ice.event.captured", "panelSixForm:memberOwnLink"]
    ],
    callback: futureReturned
  }
  sendRequest(options)
}
function sendSecondBackRequest() {
  let options = {
    url: "https://mercuryweb.berkeley.edu/MercuryWeb/faces/pages/reserve/ReservationView.xhtml",
    formId: "buttonsForm",
    extraFormData: [
      ["javax.faces.partial.execute", "@all"]
      ["ice.event.captured", "buttonsForm:backButton"]
    ],
    callback: () => {console.log("second back returned.")}
  }
  sendRequest(options)
}

function historyReturned() {
  if (xhr.readyState === XMLHttpRequest.DONE) {
    if (xhr.status === 200) {
      console.log(xhr.responseXML)

      pastResContent = xhr.responseXML.getElementById('content_content');
      parseContent()
      //sendFirstBackRequest()
    }
  }
}

function firstBackReturned() {
  if (xhr.readyState === XMLHttpRequest.DONE) {
    if (xhr.status === 200) {
      console.log("first back returned.")
      sendFutureRequest()
    }
  }
}

function futureReturned() {
  if (xhr.readyState === XMLHttpRequest.DONE) {
    if (xhr.status === 200) {
      console.log(xhr.responseXML)
      futureResContent = xhr.responseXML.getElementById('content_content');
      parseContent()
      sendSecondBackRequest()
    }
  }  
}

function parseContent() {

  // *** Reservation History ***
  // deal with the CDATA tag to get at the inner elements. 
  // here, childNodes is the right one, because it's a character data node. 
  cdata = pastResContent.childNodes[0].data
  let parser = new DOMParser()
  let contentDiv = parser.parseFromString(cdata, "text/html")
  let table = contentDiv.getElementById('reservationTableForm:reservationViewTable_body')
  console.log(table)

  let equipment, beginTime, endTime;
  let reservations = [];
  for (row of table.children) {
    equipment = row.children[2].firstElementChild.innerText;
    beginTime = row.children[3].firstElementChild.innerText;
    endTime = row.children[4].firstElementChild.innerText;
    reservations.push({ equipment, beginTime, endTime })
  }
  popupCallback(reservations)
  // for some reason, I need to reload after this xhr call
  window.location.reload(false);
}

chrome.runtime.onMessage.addListener((msg, sender, callback) => {
  if ((msg.from === 'popup') && (msg.subject === 'ReservationData')) {
    popupCallback = callback
    sendHistoryRequest()
  }
  return true // this keeps the port open for async reply later
})

console.log("I'm here")