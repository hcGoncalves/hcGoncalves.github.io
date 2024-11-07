function setup() {
    const localStorageTheme = localStorage.getItem("theme");

    const systemSettingDark = window.matchMedia("(prefers-color-scheme: dark)");
    let currentThemeSetting = calculateSettingAsThemeString({localStorageTheme, systemSettingDark})
    document.querySelector("html").setAttribute("data-theme", currentThemeSetting);

    if (currentThemeSetting == "light") {
        document.querySelector("[data-theme-toggle]").checked = true;
    }

    const input = document.querySelector("[data-theme-toggle]");
    input.addEventListener("click", () => {
        const newTheme = input.checked === true ? "light" : "dark";

        document.querySelector("html").setAttribute("data-theme", newTheme);

        localStorage.setItem("theme", newTheme);
        currentThemeSetting = newTheme;
    })


    storeFilms()
}

function calculateSettingAsThemeString({localStorageTheme, systemSettingDark}) {
    if (localStorageTheme !== null) {
        return localStorageTheme
    }

    if (systemSettingDark.matches) {
        return "dark";
    } else {
        return "light";
    }
}

function showSort(sortBy) {
    if (sortBy == "Genres") {
      if (document.getElementById("GenresDiv").style.display == "none") {
        document.getElementById("GenresDiv").style.display = "inline-block";
      } else {
        document.getElementById("GenresDiv").style.display = "none";
      } 

      document.getElementById("ServicesDiv").style.display = "none";
    } else if (sortBy == "Services") {
      if (document.getElementById("ServicesDiv").style.display == "none") {
        document.getElementById("ServicesDiv").style.display = "inline-block";
      } else {
        document.getElementById("ServicesDiv").style.display = "none";
      }

      document.getElementById("GenresDiv").style.display = "none";
    }
}

const filters = {"Genre" : "", "Service" : "", "Name" : ""};

function setFilter(filterName, filterValue) {
    filters.Name = "";
    document.getElementById("searchBar").value = "";
    
    if (filters[filterName] === undefined) {console.warn("Unknown '" + filterName + "' filter used");}
    else {filters[filterName] = filterValue;}

    if (filterName == "Genre") {document.getElementById("GenresButton").innerText = filterValue;}
    else if (filterName == "Service") {document.getElementById("ServicesButton").innerText = filterValue;}

        getFilms();
    }

function clearFilters(specific) {
    if (specific === undefined) {
        for (const [key, value] of Object.entries(filters)) {
            filters[key] = "";
        }

        document.getElementById("GenresButton").innerText = "Genres";
        document.getElementById("ServicesButton").innerText = "Streaming Services";
        document.getElementById("searchBar").value = "";
    } else {
        if (specific == "Genre") {
        filters["Genre"] = "";
        document.getElementById("GenresButton").innerText = "Genres";
        } else if (specific == "Service"){
        filters["Service"] = "";
        document.getElementById("ServicesButton").innerText = "Streaming Services";
        }
    }

    getFilms();
}

const storedFilms = [];

function storeFilms() {
    fetch("films.txt")
        .then((res) => res.text())
        .then((text) => {

        let currentCommand = "";
        let currentValues = {};

        let findingCommand = true;

        let filmName = "Undefined";
        let service = "Undefined";
        let genre = "Undefined";

        for (let i = 0; i < text.length; i++) {
            if (text.charAt(i) == ':') {
                findingCommand=false; 
                currentValue=""; 
                continue;
            }
            else if (text.charAt(i) == ";") {
                currentCommand = currentCommand.trim();
                currentValue = currentValue.trim();

                currentValues[currentCommand] = currentValue;

                findingCommand=true; 
                currentCommand=""; 
                continue;
            }
            else if (text.charAt(i) == "~") {
                storedFilms.push(currentValues);
                currentValues = {};

                continue;
            }
            
            if (text.charCodeAt(i) < 32) {continue;}

            if (findingCommand) {currentCommand += text.charAt(i)}
            else {currentValue += text.charAt(i)}
        }
        })

    .catch((e) => console.error(e))

    setTimeout(getFilms, 150);
    }

function getFilms() {
    if (filters.Name != "") {
        document.getElementById("filter-header").innerText = "Searching '" + filters.Name + "'";
    } else if (filters.Genre != "" || filters.Service != "") {
        document.getElementById("filter-header").innerText = "Browse All of " + filters.Service + " " + filters.Genre;
    } else {
        document.getElementById("filter-header").innerText = "Browse All of the Films and Shows";
    }

    let deletedAll = false
    while (!deletedAll) {
        const foundPreview = document.getElementById("FilmPreview")

        if (foundPreview) {
            foundPreview.remove();
        } else {
            deletedAll = true;
        }
    }

    let resultsFound = 0
    for (let i = 0; i < storedFilms.length; i++) {
        let inFilter = true;

        for (const [key, value] of Object.entries(filters)) {
            if (value!="" && storedFilms[i][key].toLowerCase().includes(value.toLowerCase()) == false) {
                inFilter = false;
                break;
            }
        }

        if (inFilter) {
            resultsFound++;

            const newPreview = document.createElement("div");
            newPreview.id = "FilmPreview";
            newPreview.className = "film-preview";

            newPreview.onclick = function() {
                showFilmDetail(storedFilms[i])
            }

            const newImage = document.createElement("img");

            const desiredUrl = "graphics/filmImages/" + storedFilms[i].Name + ".jpeg"
            newImage.src = desiredUrl;

            newImage.alt = "Essential assets missing";
            newImage.style = "height:150px;";
            newImage.setAttribute("onerror", "imgError(this)");

            const nameElement = document.createElement("p");
            nameElement.className = "styled-text";
            nameElement.style = "width: 115px; margin:0; text-align: center; font-size: medium; text-overflow: ellipsis; white-space: nowrap; overflow:hidden;";

            nameElement.innerText = storedFilms[i].Name;

            const detailsElement = document.createElement("p");
            detailsElement.className = "styled-text";
            detailsElement.style = "width: 115px; margin:2px; text-align: center; font-size: small; white-space: nowrap; overflow:hidden;";

            detailsElement.innerText = storedFilms[i].Service + "\n" + storedFilms[i].Genre;


            newPreview.appendChild(newImage);
            newPreview.appendChild(nameElement);
            newPreview.appendChild(detailsElement);

            const newIl = document.createElement("il")
            newIl.appendChild(newPreview)

            document.getElementById("FilmsList").appendChild(newIl);
        }
    }

    document.getElementById("ResultsFoundPara").innerText = resultsFound + " Results Found";
}

function hideFilmDetail() {
    filmDetail.className = "film-detail hide";
    document.getElementById("filmDetailImage").setAttribute("src", "graphics/assets/missingImage.png");
    document.getElementById("trailer-player").setAttribute("src", "");
}

function showFilmDetail(details) {
    const filmDetail = document.getElementById("filmDetail");

    document.getElementById("filmDetailName").innerText = details.Name;
    document.getElementById("filmDetailService").innerText = "Available on " + details.Service;
    document.getElementById("filmDetailGenre").innerText = details.Genre + " Film";
    document.getElementById("filmDetailRating").innerText = "Rating " + details.Rating + "/10";
    
    const filmDatePara = document.getElementById("filmDetailsDate");
    if (details.ReleaseDate === undefined) {
      filmDatePara.innerText = "Released Date: Missing";
    } else {
      filmDatePara.innerText = "Released Date: " + details.ReleaseDate;
    }

    const filmLinkElement = document.getElementById("filmDetailsIMDb");
    if (details.IMDbLink === undefined) {
      filmLinkElement.href = ""
      filmLinkElement.style = "pointer-events: none;";

      filmLinkElement.innerText = details.Name + " IMDb Link Unavailable";
    } else {
      filmLinkElement.href = details.IMDbLink;
      filmLinkElement.style = "color:rgb(0,200,255); pointer-events: all;";

      filmLinkElement.innerText = details.Name + " IMDb Link";
    }

    const filmTrailerPlayer = document.getElementById("trailer-player");
    if (details.TrailerURL === undefined) {
        filmTrailerPlayer.src = "";
    } else {
        filmTrailerPlayer.src = "https://www.youtube.com/embed/" + details.TrailerURL;
    }

    const imageElement = document.getElementById("filmDetailImage");

    const desiredUrl = "graphics/filmImages/" + details.Name + ".jpeg";
    imageElement.src = desiredUrl

    filmDetail.className = "film-detail show";
}

window.onscroll = function(e) {
    const formattedTop = `${window.scrollY+25}px`;
    document.getElementById("filmDetail").style.top = formattedTop;
}

function imgError(img) {
    img.setAttribute("src", "graphics/assets/missingImage.png");
}
