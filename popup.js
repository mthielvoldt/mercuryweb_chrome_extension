let reservationsBtn = document.getElementById('resBtn');
let checkDateBtn = document.getElementById('checkDate');
let instructionsLink = document.getElementById('showInstructionsLink');
let imageLink = document.getElementById('imageLink');
let backBtn = document.getElementById('backBtn');
let dateInput = document.getElementById('dateInput');
let message1 = document.getElementById('message1');
let message2 = document.getElementById('message2');
let reservations = null

// *************** Button events **********************
checkDateBtn.onclick = (element) => {

  if (reservations === null) {
    let alert = document.getElementById('tooltip')
    alert.style.visibility = "visible";
    alert.style.opacity = "1";
    setTimeout( () => {
      alert.style.visibility = "hidden";
      alert.style.opacity = "0";
    }, 2500)
    return
  }

  let date = dateInput.value
  let time = timeInput.value
  let dateTime = date + 'T' + time + ':00.000Z'
  dateTime = Date.parse(dateTime)
  console.log(dateTime)
  console.log(Date.now())
  let relevant = reservations.filter((res) => filterFn(res, dateTime))
  availableFrom = 24 - relevant.reduce(reduceFn, 0)
  message2.innerHTML = "You will have <strong>" + availableFrom + "h</strong> available at the entered time"
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

instructionsLink.onclick = (element) => {
  document.getElementById('mainContent').setAttribute('hidden', '');
  document.getElementById('instructions').removeAttribute('hidden');
}
backBtn.onclick = (e) => {
  document.getElementById('mainContent').removeAttribute('hidden')
  document.getElementById('instructions').setAttribute('hidden', '')
}

imageLink.onclick = (e) => {
  e.preventDefault()
  document.getElementById('reservationsImage').removeAttribute('hidden')
  imageLink.setAttribute('hidden', '')
}

// *************** Date-Time Input ******************

let now = new Date()
let tzOffset = now.getTimezoneOffset()
now.setMinutes(now.getMinutes() - tzOffset)
now = now.toJSON()
let time = now.slice(11, 16)
let date = now.slice(0,10)

dateInput.value = date
timeInput.value = time

// Gets called when content_script returns the table
function processReservations(reservationData=null) {
  if (reservationData != null) {
    reservations = reservationData
  }
  relevant = reservations.filter((res) => filterFn(res, Date.now()))
  console.log(relevant)
  // calculate the amount of time available right now. 
  timeAvailable = 24 - relevant.reduce(reduceFn, 0)
  message1.innerHTML = "You have <strong>" + timeAvailable + "</strong> core nanolab hours available right now."
  checkDateBtn.classList.remove('btn-secondary');
  checkDateBtn.classList.add('btn-primary');

}

function filterFn(reservation, fromTime) {
  let cutoffTime = fromTime - 3600000*24*14
  let resEndDate = new Date(reservation.endTime)
  let resBeginDate = new Date(reservation.beginTime)
  let resEndTime = resEndDate.getTime()

  let within14Days = resEndTime > cutoffTime

  let dayOfWeek = resEndDate.getDay()
  let onWeekday = (0 < dayOfWeek) && (dayOfWeek < 6)
  
  let resBeginMinute = resBeginDate.getHours()*60 + resBeginDate.getMinutes()
  let resEndMinute = resEndDate.getHours()*60 + resEndDate.getMinutes()
  const coreBegin = 60*7
  const coreEnd = 60*19
  let hasCoreHours = (resEndMinute > coreBegin) && (resBeginMinute < coreEnd)

  return (
    (reservation.equipment === 'nanolab') 
    && within14Days 
    && onWeekday
    && hasCoreHours
  )
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