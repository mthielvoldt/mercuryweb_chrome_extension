

/*
sequence: 
send panel 6 request
send "back button" 
send panel 2 "AllFutre" request
send "back button"
*/

// this is global so we can recycle it
let popupCallback;
let pastResContent, futureResContent;

function sendHistoryRequest() {
  console.log("sendHistoryRequest")
  
  let resHistoryLink = document.getElementById("panelSixForm:memberOwnLink_link")
  console.log(resHistoryLink)
  resHistoryLink.click()
  document.addEventListener("DomContentLoaded", clickBackBtn)
}

function clickBackBtn() {
  console.log("clickBackBtn")
  document.removeEventListener("DOMContentLoaded")
  let backBtn = document.getElementById("buttonsForm:backButton")
  backBtn.click()
  document.addEventListener("DOMContentLoaded", clickAllFuture)
}

function clickAllFuture() {
  console.log("Got there")
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