

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

function sendReservationsRequest() {
  panelSixForm = document.getElementById("panelSixForm");
  let formData = new FormData(panelSixForm)
  
  formData.append("javax.faces.partial.execute", "@all"); // essential
  formData.append("ice.event.captured", "panelSixForm:memberOwnLink"); // essential

  const queryString = new URLSearchParams(formData).toString()
  
  xhr.open("POST", 'https://mercuryweb.berkeley.edu/MercuryWeb/faces/pages/reserve/Reservations.xhtml')
  xhr.onreadystatechange = resHistoryReturned;
  xhr.responseType = "document"
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded;charset=UTF-8");
  xhr.setRequestHeader("Faces-Request", "partial/ajax")
  xhr.send(queryString)
}

function resHistoryReturned() {
  if (xhr.readyState === XMLHttpRequest.DONE) {
    if (xhr.status === 200) {
      console.log(xhr.responseXML)

      let content = xhr.responseXML.getElementById('content_content');
      // deal with the CDATA tag to get at the inner elements. 
      // here, childNodes is the right one, because it's a character data node. 
      cdata = content.childNodes[0].data
      let parser = new DOMParser()
      let contentDiv = parser.parseFromString(cdata, "text/html")
      let table = contentDiv.getElementById('reservationTableForm:reservationViewTable_body')
      console.log(table)

      let equipment, beginTime, endTime;
      let reservations = [];
      for ( row of table.children) {
        equipment = row.children[2].firstElementChild.innerText;
        beginTime = row.children[3].firstElementChild.innerText;
        endTime = row.children[4].firstElementChild.innerText;
        reservations.push({equipment, beginTime, endTime})
      }
      popupCallback(reservations)
      // for some reason, I need to reload after this xhr call
      window.location.reload(false); 
    }
  }
}

chrome.runtime.onMessage.addListener((msg, sender, callback) => {
  if ((msg.from === 'popup') && (msg.subject === 'ReservationData')) {
    popupCallback = callback
    sendReservationsRequest()
  }
  return true // this keeps the port open for async reply later
})

console.log("I'm here")