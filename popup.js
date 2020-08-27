let changeColor = document.getElementById('changeColor');
let reservationsBtn = document.getElementById('resBtn');
let recalculateBtn = document.getElementById('recalculate');
let availableP = document.getElementById('available');
let reservations = null

chrome.storage.sync.get('color', function(data) {
  // on load of stored value, set the button attributes and style
  changeColor.style.backgroundColor = data.color;
  changeColor.setAttribute('value', data.color);
});

changeColor.onclick = function(element) {
  let color = element.target.value;
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.executeScript(
        tabs[0].id,
        {code: 'document.body.style.backgroundColor = "' + color + '";'});
  });
  console.log("Changed to green")
};

recalculateBtn.onclick = () => {processReservations(null)}

reservationsBtn.onclick = function(element) {
  console.log("getReservations button clicked")

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    // use a message to trigger the content_script to get reservations. 
    chrome.tabs.sendMessage(
      tabs[0].id,
      {from: "popup", subject: 'ReservationData'}, processReservations); 
  });
}

function processReservations(reservationData=null) {
  if (reservationData != null) {
    reservations = reservationData
  }
  console.log(reservations)

  function filterFn(reservation) {
    cutoffDate = Date.now() - 3600000*24*14
    reservationDate = Date.parse(reservation.endTime)
    within14Days = reservationDate > cutoffDate
    return (reservation.equipment === 'nanolab') && within14Days
  }
  
  relevant = reservations.filter(filterFn)
  console.log(relevant)

  // calculate the amount of time available right now. 
  timeAvailable = 24 - relevant.reduce(reduceFn, 0)

  function reduceFn(prevTotal, reservation) {
    end   = Date.parse(reservation.endTime)
    begin = Date.parse(reservation.beginTime) 
    resHours = (end - begin)/1000/3600
    console.log(resHours)
    return prevTotal + resHours
  }

  
}