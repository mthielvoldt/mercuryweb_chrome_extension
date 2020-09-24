let reservationsBtn = document.getElementById('resBtn');
let checkDateBtn = document.getElementById('checkDate');
let instructionsLink = document.getElementById('showInstructionsLink');
let imageLink = document.getElementById('imageLink');
let backBtn = document.getElementById('backBtn');
let dateInput = document.getElementById('dateInput');
let message1 = document.getElementById('message1');
let message2 = document.getElementById('message2');

let reservations = null
const coreBegin = 60 * 7
const coreEnd = 60 * 19

// *************** Button events **********************
checkDateBtn.onclick = (element) => {

  if (reservations === null) {
    flashTooltip('calc-btn-tooltip')
    return
  }

  let date = dateInput.value
  let time = timeInput.value
  let dateTimeISO = date + 'T' + time + ':00.000Z'
  let specifiedDate = new Date(dateTimeISO)
  let tzOffset = specifiedDate.getTimezoneOffset()
  specifiedDate.setMinutes(specifiedDate.getMinutes() + tzOffset)
  console.log(specifiedDate)
  
  availableFrom = 24 - findMaxHours(reservations, specifiedDate.getTime())
  message2.innerHTML = "You will have <strong>" + availableFrom + "h</strong> available at the entered time"
}

reservationsBtn.onclick = (element) => {
  console.log("getReservations button clicked")
  if (reservations != null) {
    processReservations()
  }

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    // use a message to trigger the content_script to get reservations. 
    chrome.tabs.sendMessage(
      tabs[0].id,
      { from: "popup", subject: 'ReservationData' }, processReservations);
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

// round up to the next 30 minutes
if (now.getMinutes() > 30) {
  now.setHours(now.getHours() + 1)
  now.setMinutes(0)
} else {
  now.setMinutes(30)
}
let tzOffset = now.getTimezoneOffset()
now.setMinutes(now.getMinutes() - tzOffset)
now = now.toJSON()

let time = now.slice(11, 16)
let date = now.slice(0, 10)

dateInput.value = date
timeInput.value = time

// Gets called when content_script returns the table
function processReservations(reservationData = null) {
  if (reservationData != null) {
    reservations = reservationData
  } else {
    flashTooltip('current-hours-btn-tooltip')
  }

  // convert time strings to Date objects
  convertDates(reservations)

  reservations = reservations.filter((res) => filterFn(res, Date.now()))

  // prune any non-core hours from reservations
  cropToCoreHours(reservations)
  console.log(reservations)

  // find maximum in sliding winow 
  let maxHours = findMaxHours(reservations, Date.now())

  // calculate the amount of time available right now. 
  let timeAvailable = 24 - maxHours;
  message1.innerHTML = "You have <strong>" + timeAvailable + "</strong> core nanolab hours available right now."
  checkDateBtn.classList.remove('btn-secondary');
  checkDateBtn.classList.add('btn-primary');

}

function findMaxHours(reservations, now) {
  // calculate with window ending at current time. 
  let maxSum, last, deltaUsingEnd, deltaUsingStart;
  [maxSum, last] = totalInWindow(reservations, now)
  last--; // totalInWindow actually returns first index after the last one. 

  let lastRes = reservations[reservations.length-1];
  let wBegin, wEnd = now;
  let first = 0;
  
  // move wBegin to the nearest of: 
  // the beginning of the first reservation in the window
  // the end of the first reservation that is after the window
  while (wEnd < lastRes.end.getTime()) { 
    wBegin = wEnd - 1209600000

    deltaUsingStart = reservations[first].begin.getTime() - wBegin;
    if (deltaUsingStart <= 0) {
      deltaUsingStart = reservations[first+1].begin.getTime() - wBegin;
    }
    deltaUsingEnd = reservations[last].end.getTime() - wEnd;
    // our present wEnd may either be after a 
    if (deltaUsingEnd <= 0 && (last+1) < reservations.length) {
      deltaUsingEnd = reservations[last+1].end.getTime() - wEnd;
    }
    console.log(deltaUsingStart/3600000, deltaUsingEnd/3600000)
    if (deltaUsingStart <= deltaUsingEnd || deltaUsingEnd <= 0) {
      wEnd += deltaUsingStart;
      first++;
    } else {
      wEnd += deltaUsingEnd;
      // don't need to increment last - it gets done below
    }
    [thisSum, last] = totalInWindow(reservations, wEnd);
    last--;
    maxSum = Math.max(maxSum, thisSum)
  }
  return maxSum
}

function totalInWindow(reservations, wEnd) {
  let wBegin = wEnd - 1000 * 3600 * 24 * 14

  let totalHours = 0
  let msDur;
  let i;
  for (i = 0; i < reservations.length; i++) {
    resBegin = reservations[i].begin.getTime()
    resEnd = reservations[i].end.getTime()
    if (resBegin >= wEnd) {
      break
    }
    if (resEnd <= wBegin) {
      continue
    } 
    msDur = Math.min(resEnd, wEnd) - Math.max(resBegin, wBegin)
    totalHours += msDur / 1000 / 3600
  }
  console.log(totalHours, new Date(wBegin).toLocaleString("en-US"), new Date(wEnd).toLocaleString("en-US"))
  return [totalHours, i]
}

function convertDates(reservations) {
  reservations.forEach((res) => {
    res.begin = new Date(res.beginTime);
    res.end = new Date(res.endTime);
  })
}

function cropToCoreHours(reservations) {
  reservations.forEach((res, i) => {
    let beginMinute = res.begin.getHours() * 60 + res.begin.getMinutes();
    let endMinute = res.end.getHours() * 60 + res.end.getMinutes();

    if (beginMinute < coreBegin) {
      res.begin = new Date(
        res.begin.getTime() + (coreBegin - beginMinute) * 60000);
      console.log(`cropped begin of ${i}`)
    }
    if (endMinute > coreEnd) {
      res.begin = new Date(
        res.end.getTime() - (endMinute - coreEnd) * 60000);
      console.log(`cropped end of ${i}`)
    }
  })
}

function filterFn(res, fromTime) {
  let cutoffTime = fromTime - 3600000 * 24 * 14

  let within14Days = res.end.getTime() > cutoffTime

  let dayOfWeek = res.end.getDay()
  let onWeekday = (0 < dayOfWeek) && (dayOfWeek < 6)

  let beginMinute = res.begin.getHours() * 60 + res.begin.getMinutes()
  let endMinute = res.end.getHours() * 60 + res.end.getMinutes()
  let hasCoreHours = (endMinute > coreBegin) && (beginMinute < coreEnd)

  return (
    (res.equipment === 'nanolab')
    && within14Days
    && onWeekday
    && hasCoreHours
  )
}

function flashTooltip(id) {
  let alert = document.getElementById(id)
  alert.style.visibility = "visible";
  alert.style.opacity = "1";
  setTimeout(() => {
    alert.style.visibility = "hidden";
    alert.style.opacity = "0";
  }, 2500)
}
