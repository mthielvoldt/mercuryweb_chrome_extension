


function sendReservationsRequest(callback) {
  reservationsForm = document.getElementById("panelSixForm");
  let xhr = new XMLHttpRequest();
  let formData = new FormData(reservationsForm)
  formData.append("javax.faces.source", "panelSixForm:memberOwnLink");
  formData.append("javax.faces.partial.execute", "@all");
  formData.append("javax.faces.partial.render", "@all");
  formData.append("ice.focus", "panelSixForm:memberOwnLink_link");
  formData.append("ice.event.target", "panelSixForm:memberOwnLink_link");
  formData.append("ice.event.captured", "panelSixForm:memberOwnLink");
  formData.append("ice.event.type", "onclick");
  formData.append("ice.event.x", "756");
  formData.append("ice.event.y", "429");
  formData.append("ice.event.left", "true");
  formData.append("javax.faces.partial.ajax", "true");
  formData.append("panelSixForm:memberOwnLink", "panelSixForm:memberOwnLink");
  formData.append("ice.event.alt", "false");
  formData.append("ice.event.ctlr", "false");
  formData.append("ice.event.shift", "false");
  formData.append("ice.event.meta", "false");
  formData.append("ice.event.right", "false");
  const queryString = new URLSearchParams(formData).toString()
  // for ([key, value] of formData.entries()) {
  //   console.log(key, value)
  // }
  
  xhr.open("POST", 'https://mercuryweb.berkeley.edu/MercuryWeb/faces/pages/reserve/Reservations.xhtml')
  xhr.onreadystatechange = xhrReturned;
  xhr.responseType = "document"
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded;charset=UTF-8");
  xhr.setRequestHeader("Faces-Request", "partial/ajax")
  xhr.send(queryString)

  function xhrReturned() {
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
        callback(reservations)
      }
    }
  }
}

chrome.runtime.onMessage.addListener((msg, sender, callback) => {
  if ((msg.from === 'popup') && (msg.subject === 'ReservationData')) {
    sendReservationsRequest(callback)
  }
  return true
})

console.log("I'm here")