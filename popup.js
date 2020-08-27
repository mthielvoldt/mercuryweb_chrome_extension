let reservationsBtn = document.getElementById('resBtn');
let checkDateBtn = document.getElementById('checkDate');
let dateInput = document.getElementById('dateInput');
let message1 = document.getElementById('message1');
let message2 = document.getElementById('message2');
let reservations = null

checkDateBtn.onclick = (element) => {
  console.log(Date.parse(dateInput.value))
  fromDate = Date.parse(dateInput.value);
  let relevant = reservations.filter((res) => filterFn(res, fromDate))
  availableFrom = 24 - relevant.reduce(reduceFn, 0)
  message2.innerText = "You will have " + availableFrom + "h available at the entered time"
}
reservationsBtn.onclick = (element) => {
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
  relevant = reservations.filter((res) => filterFn(res, Date.now()))
  console.log(relevant)
  // calculate the amount of time available right now. 
  timeAvailable = 24 - relevant.reduce(reduceFn, 0)
  message1.innerText = "You have " + timeAvailable + " nanolab hours available right now."
}

function filterFn(reservation, fromDate) {
  cutoffDate = fromDate - 3600000*24*14
  reservationDate = Date.parse(reservation.endTime)
  within14Days = reservationDate > cutoffDate
  return (reservation.equipment === 'nanolab') && within14Days
}

function reduceFn(prevTotal, reservation) {
  end   = Date.parse(reservation.endTime)
  begin = Date.parse(reservation.beginTime) 
  resHours = (end - begin)/1000/3600
  console.log(resHours)
  return prevTotal + resHours
}