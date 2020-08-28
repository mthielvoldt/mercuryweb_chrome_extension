let reservationsBtn = document.getElementById('resBtn');
let checkDateBtn = document.getElementById('checkDate');
let dateInput = document.getElementById('dateInput');
let message1 = document.getElementById('message1');
let message2 = document.getElementById('message2');
let reservations = null

// *************** Button events **********************
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
  relevant = reservations.filter((res) => filterFn(res, Date.now()))
  console.log(relevant)
  // calculate the amount of time available right now. 
  timeAvailable = 24 - relevant.reduce(reduceFn, 0)
  message1.innerText = "You have " + timeAvailable + " core nanolab hours available right now."
}

function filterFn(reservation, fromDate) {
  cutoffDate = fromDate - 3600000*24*14
  reservationDate = new Date(reservation.endTime)
  dayOfWeek = reservationDate.getDay()
  within14Days = reservationDate > cutoffDate
  weekday = (0 < dayOfWeek) && (dayOfWeek < 6)
  return (reservation.equipment === 'nanolab') && within14Days && weekday
}

function reduceFn(prevTotal, reservation) {
  const coreBegin = 60*7
  const coreEnd = 60*19
  
  let begin = new Date(reservation.beginTime) 
  let end   = new Date(reservation.endTime)
  // we know that begin time is on a weekday.  
  // begin could be before core hours,
  // or end could be after core hours
  beginMinute = begin.getHours()*60 + begin.getMinutes()
  endMinute = end.getHours()*60 + end.getMinutes()

  // if end was before 7AM, or begin was after 7PM, these were not core-hours
  if (endMinute <= coreBegin || beginMinute >= coreEnd) {
    console.log(0)
    return prevTotal
  }

  // if begin was before 7:00 AM, calculate as though begin was 7:00 AM
  if (beginMinute < coreBegin) {
    beginMinute = coreBegin
    console.log("adjusted begin forward ", coreBegin - beginMinute, " mins for record: ", reservation)
  }
  // if end was after 7:00 PM, calculate as though end was 7:00 pm
  if (endMinute > coreEnd) {
    endMinute = coreEnd
    console.log("adjusted end backward ", endMinute - coreEnd, " mins for record: ", reservation)
  }

  resHours = (endMinute - beginMinute)/60
  console.log(resHours)
  return prevTotal + resHours
}