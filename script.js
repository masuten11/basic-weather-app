// Select all necessary elements
const userQuery = document.querySelector("#userQuery");
const searchBtt = document.querySelector("#searchBtn");
const City = document.querySelector("#city");
const weatherIcon = document.querySelector("#weather-icon");
const Temperature = document.querySelector("#temperature");
const celsiusBtt = document.querySelector("#celsius");
const fahrenheitBtt = document.querySelector("#fahrenheit");
const dayTime = document.querySelector("#day-time");
const advancedInfo = document.querySelector(".advanced-info");
const forecastGrid = document.querySelector(".forecast-grid");
// Default coordinates(for back-up)
let lati = 53.4808;
let long = -2.2426;

// Function to fetch API and display the weather Data
async function fetchWeatherData(lat, lon) {
  const weatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=54ad9ab73344fb9549bf2b199e86e00f`;

  try {
    const response = await fetch(weatherURL);
    const data = await response.json();
    console.log(data);

    // Display the weather data with updated attributes
    City.innerText = data.name;
    Temperature.innerText = `${(Number(data.main.temp) - 273.15).toFixed(1)}°C`;
    Temperature.classList.add("Celsius");
    advancedInfo.firstElementChild.innerText = `Wind Speed: ${(Number(data.wind.speed) * 3.6).toFixed(1)}km/h`;
    advancedInfo.firstElementChild.setAttribute("id", "wind-speed");
    advancedInfo.children[1].innerText = `Humidity: ${data.main.humidity}%`;
    advancedInfo.children[1].setAttribute("id", "humidity");

    // Set up the weather icon
    weatherIcon.setAttribute("src", `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`);

    // Display one among rain/snow/feels like
    if (data.rain && data.rain["1h"]) {
      advancedInfo.children[2].innerText = `Last Hour: ${data.rain["1h"]}mm`;
      advancedInfo.children[2].setAttribute("id", "rain");
    }
    else if (data.snow && data.snow["1h"]) {
      advancedInfo.children[2].innerText = `Last Hour: ${data.snow["1h"]}mm`;
      advancedInfo.children[2].setAttribute("id", "snow");
    }
    else {
      advancedInfo.children[2].innerText = `Feels Like: ${(Number(data.main.feels_like) - 273.15).toFixed(1)}°C`;
      advancedInfo.children[2].setAttribute("id", "heat");
    }

    console.log("Weather Data Updated!");
    return data;
  } catch (error) {
    console.error(error);
  }
}


// Function to fetch API and display the weather forecast
async function fetchWeatherCast(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=54ad9ab73344fb9549bf2b199e86e00f&units=metric`;

  // Fetch the weather forecast API
  fetch(url)
    .then(response => response.json())
    .then(data => {
      const dailyData = {};
      const usedDates = new Set();
      console.log(data);

      // Array to store recent forecast
      let upcomingForecast = [data.list[0], data.list[1], data.list[2], data.list[3]];
      // Loop through recent foreast
      upcomingForecast.map((forecast, index) => {
        // Create Elements
        const time = document.createElement("p");
        const weatherDetails = document.createElement("p");
        const weatherIcon = document.createElement("img");
        const icon = forecast.weather[0].icon;

        // Set up attributes & text 
        time.innerText = `${forecast.dt_txt.slice(11, 13)}hrs`;
        weatherDetails.innerText = `${Number(forecast.main.temp).toFixed(1)}°C | ${(Number(forecast.wind.speed) * 3.6).toFixed(1)}km/h`;
        weatherIcon.setAttribute("src", `https://openweathermap.org/img/wn/${icon}@2x.png`);

        // Append to the document flow
        forecastGrid.children[index].appendChild(time);
        forecastGrid.children[index].setAttribute("id", `${forecast.dt_txt.slice(11, 13)}hrs`);
        time.after(weatherIcon);
        weatherIcon.after(weatherDetails);
      });

      // Collect unique day names with their entries
      data.list.forEach(entry => {
        const dateStr = entry.dt_txt.split(" ")[0];
        if (usedDates.has(dateStr)) return; // skip if already processed
        const dayName = new Date(dateStr).toLocaleDateString("en-US", { weekday: "long" });

        if (!dailyData[dayName]) {
          dailyData[dayName] = [];
        }
        dailyData[dayName].push(entry);
        usedDates.add(dateStr);
      });

      // Limit to 4 days
      const dayNames = Object.keys(dailyData).slice(0, 4);

      // Loop over each of the 4 days and update DOM
      dayNames.forEach((day, index) => {
        const entries = dailyData[day];
        const temps = entries.map(e => e.main.temp);
        const min = Math.min(...temps).toFixed(1);
        const max = Math.max(...temps).toFixed(1);

        const noonEntry = entries.find(e => e.dt_txt.includes("12:00:00")) || entries[0];
        const icon = noonEntry.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

        // DOM creation
        let gridChild = forecastGrid.children[index + 4]; // start at child 4
        let Day = document.createElement("p");
        let WeatherIcon = document.createElement("img");
        let Temperature = document.createElement("p");

        // Add attributes and text
        Day.innerText = day.slice(0, 3).toUpperCase();
        Temperature.innerText = `${min}°/${max}°`;
        gridChild.setAttribute("class", day);
        Day.setAttribute("id", day);
        Temperature.setAttribute("id", "Celsius");
        WeatherIcon.setAttribute("src", iconUrl);
        WeatherIcon.setAttribute("id", day);

        // Append to the document flow
        gridChild.appendChild(Day);
        Day.after(WeatherIcon);
        WeatherIcon.after(Temperature);
      });

    })
    .catch(error => console.error("Error:", error));
}


// Function to collect user location and fetch APIs
const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    const handlePosition = (latitude, longitude) => {
      Promise.all([
        fetchWeatherData(latitude, longitude),
        fetchWeatherCast(latitude, longitude)
      ])
        .then(([weatherData, weatherCast]) => {
          resolve({ weatherData, weatherCast });
        })
        .catch((error) => {
          reject(error);
        });
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          handlePosition(latitude, longitude);
        },
        (error) => {
          console.warn("Geolocation error:", error.message);
          // fallback default coordinates
          handlePosition(lati, long);
        }
      );
    } else {
      console.warn("Geolocation not supported");
      handlePosition(lati, long);
    }
  });
};

// Function to update weather data on search query
const updateQuery = () => {
  if (userQuery.value.trim() !== "") {
    const cityProvided = userQuery.value.trim().charAt(0).toUpperCase() + userQuery.value.trim().slice(1);

    // Fetch to get latitude and lontitude version
    const URL = `http://api.openweathermap.org/geo/1.0/direct?q=${cityProvided}&limit=5&appid=54ad9ab73344fb9549bf2b199e86e00f`;
    fetch(URL)
      .then(response => response.json())
      .then(data => {
        let latit = data[0].lat;
        let longi = data[0].lon;

        // Fetch Weather Data
        fetchWeatherData(latit, longi);
        // Remove any previous forecast element if available
        const forecastCons = forecastGrid.querySelectorAll(":scope > div");
        forecastCons.forEach(con => con.innerHTML = "");
        // Fetch Weather Forecast 
        fetchWeatherCast(latit, longi);

        // Display the weather data with updated attributes
        City.innerText = data[0].name;
        console.log(data);
      })
      .catch(error => console.error(error))
  }
}

// Function to display current time and day
const DayTime = () => {
  const curr = new Date();
  const days = ["Sunday", "Saturday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]; //array to store days
  const currDay = days[curr.getDay()];
  const currTime = `${curr.getHours()}:${curr.getMinutes()}`;

  // Updating day and time
  dayTime.innerText = `${currDay} ${currTime}`;
  console.log("Time Updated!");
}



// Function to toggle temperature between celsius and fahrenheit
function convertTemp(currForm) {
  if (currForm === "Celsius" && Temperature.classList.contains("Celsius")) {
    // Convert main temperature
    const cTemp = Number(Temperature.innerText.replace(/[^\d.-]/g, ""));
    const fTemp = (cTemp * 1.8 + 32).toFixed(1);
    Temperature.innerText = `${fTemp}°F`;

    // Convert forecast temperatures
    forecastGrid.querySelectorAll("div").forEach((element, index) => {
      const tempEl = element.lastElementChild;

      if (index < 4) {
        // format: "22.5°C | 10.8km/h"
        const [tempPart, windPart] = tempEl.innerText.split(" | ");
        const fTemp = (parseFloat(tempPart) * 1.8 + 32).toFixed(1);
        tempEl.innerText = `${fTemp}°F | ${windPart}`;
      } else {
        // format: "19.0°/25.5°"
        const [min, max] = tempEl.innerText.split("/").map(t => parseFloat(t));
        const fMin = (min * 1.8 + 32).toFixed(1);
        const fMax = (max * 1.8 + 32).toFixed(1);
        tempEl.innerText = `${fMin}°F/${fMax}°F`;
      }
    });
    // Update classlist
    Temperature.classList.remove("Celsius");
    Temperature.classList.add("Fahrenheit");
  }

  else if (currForm === "Fahrenheit" && Temperature.classList.contains("Fahrenheit")) {
    // Convert main temperature
    const fTemp = Number(Temperature.innerText.replace(/[^\d.-]/g, ""));
    const cTemp = ((fTemp - 32) / 1.8).toFixed(1);
    Temperature.innerText = `${cTemp}°C`;

    // Convert forecast temperatures
    forecastGrid.querySelectorAll("div").forEach((element, index) => {
      const tempEl = element.lastElementChild;

      if (index < 4) {
        const [tempPart, windPart] = tempEl.innerText.split(" | ");
        const cTemp = ((parseFloat(tempPart) - 32) / 1.8).toFixed(1);
        tempEl.innerText = `${cTemp}°C | ${windPart}`;
      } else {
        const [min, max] = tempEl.innerText.split("/").map(t => parseFloat(t));
        const cMin = ((min - 32) / 1.8).toFixed(1);
        const cMax = ((max - 32) / 1.8).toFixed(1);
        tempEl.innerText = `${cMin}°C/${cMax}°C`;
      }
    });
    // Update classlist
    Temperature.classList.remove("Fahrenheit");
    Temperature.classList.add("Celsius");
  }
  else { alert("Bad Request!") };
}


// Add Event Listeners
//
// Event listener to trigger API call on load
window.addEventListener("load", () => {
  getUserLocation()
    .then(({ weatherData, weatherCast }) => {
      console.log("Weather data:", weatherData);
      console.log("Forecast data:", weatherCast);
    })
    .catch(error => {
      console.error("Error:", error);
    });
});

//Event listeners to update time
window.addEventListener("load", () => DayTime());
setInterval(() => DayTime(), 60000);

// Event listeners for the search query
searchBtt.addEventListener("click", () => {
  updateQuery();
  userQuery.value = "";
});
document.addEventListener("keypress", function(e) {
  if(document.activeElement === userQuery && e.key === "Enter") {
    updateQuery();
    userQuery.value = "";
  }
});

// Event liteners to the temperature converter buttons
fahrenheitBtt.addEventListener("click", () => convertTemp("Celsius"));
celsiusBtt.addEventListener("click", () => convertTemp("Fahrenheit"));

