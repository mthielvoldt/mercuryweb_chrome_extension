let changeColor = document.getElementById('changeColor');
let reservationsBtn = document.getElementById('resBtn');
let injectBtn = document.getElementById('injectBtn');
let availableP = document.getElementById('available');

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


injectBtn.onclick = function(element) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.executeScript(
        tabs[0].id,
        {file: "content_script.js"}, 
        (results) => {
          console.log(results[0])
        }
      );
  });
}


reservationsBtn.onclick = function(element) {
  console.log("getReservations button clicked")

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.executeScript(
        tabs[0].id,
        {code: 'clickMyResLink()'}, 
        (results) => {
          console.log(results[0])
        }
      );
  });
  
}