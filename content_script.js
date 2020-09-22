

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
let pastResDoc, futureResDoc;
let form;

function sendRequest(options) {
  if (options.formId != "") {
    form = document.getElementById(options.formId);
  }
  let formData = new FormData(form)
  console.log(options)
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

function sendFutureRequest() {
  console.log("sendFurtureRequest")
  let options = {
    url: "https://mercuryweb.berkeley.edu/MercuryWeb/faces/pages/reserve/Reservations.xhtml",
    formId: "panelTwoForm",
    extraFormData: [
      ["javax.faces.partial.execute", "@all"],
      ["ice.event.captured", "panelTwoForm:allLink"]
    ],
    callback: futureReturned
  }
  sendRequest(options)
}
function sendBackRequest() {
  let options = {
    url: "https://mercuryweb.berkeley.edu/MercuryWeb/faces/pages/reserve/ReservationView.xhtml",
    formId: "",
    extraFormData: [
      ["javax.faces.partial.execute", "@all"],
      ["ice.event.captured", "buttonsForm:backButton"], 
      ["ice.event.target", "buttonsForm:backButton"],
      ["buttonsForm", "buttonsForm"],
      ["javax.faces.source", "buttonsForm:backButton"], 

    ],
    callback: BackReturned
  }
  sendRequest(options)
}

function historyReturned() {
  if (xhr.readyState === XMLHttpRequest.DONE) {
    if (xhr.status === 200) {
      console.log("pastReturned")
      pastResDoc = xhr.responseXML;
      sendFutureRequest()
    }
  }
}

function BackReturned() {
  if (xhr.readyState === XMLHttpRequest.DONE) {
    if (xhr.status === 200) {
      console.log("first back returned.")
    }
  }
}

function futureReturned() {
  if (xhr.readyState === XMLHttpRequest.DONE) {
    if (xhr.status === 200) {
      console.log("futureReturned")
      futureResDoc = xhr.responseXML;
      parseContent()
      window.location.reload()
    }
  }  
}

function parseContent() {

  // *** Reservation History ***
  // deal with the CDATA tag to get at the inner elements. 
  // here, childNodes is the right one, because it's a character data node. 
  
  //console.log(pastResDoc)

  let pastResContent = pastResDoc.getElementById('content_content')
  let cdata = pastResContent.childNodes[0].data
  let parser = new DOMParser()
  let contentDiv = parser.parseFromString(cdata, "text/html")
  let pastResTable = contentDiv.getElementById('reservationTableForm:reservationViewTable_body')
  console.log("past reservations",pastResTable)

  let equipment, beginTime, endTime;
  let reservations = [];
  for (row of pastResTable.children) {
    if (row.children.length >= 5) {
      equipment = row.children[2].firstElementChild.innerText;
      beginTime = row.children[3].firstElementChild.innerText;
      endTime = row.children[4].firstElementChild.innerText;
      reservations.push({ equipment, beginTime, endTime })
    }
  }

  let futureResCdata = futureResDoc.getElementById('reservationTableForm:reservationViewTable_body').childNodes[0].data
  let futureResTableDoc = parser.parseFromString(futureResCdata, "text/xml")
  futureResTable = futureResTableDoc.getElementById("reservationTableForm:reservationViewTable_body")
  console.log("future reservations", futureResTable)

  for (row of futureResTable.children) {
    if ( row.children.length >= 5){
      equipment = row.children[2].textContent;
      beginTime = row.children[3].textContent;
      endTime = row.children[4].textContent;
      reservations.push({ equipment, beginTime, endTime })
    }
  }

  popupCallback(reservations)


}

chrome.runtime.onMessage.addListener((msg, sender, callback) => {
  if ((msg.from === 'popup') && (msg.subject === 'ReservationData')) {
    popupCallback = callback
    sendHistoryRequest()
  }
  return true // this keeps the port open for async reply later
})

console.log("I'm here")