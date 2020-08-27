let reservationsBtn = document.getElementById('resBtn');
let message = document.getElementById('message');
let reservations = null


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

  message.innerText = "You have " + timeAvailable + " nanolab hours available right now."

}