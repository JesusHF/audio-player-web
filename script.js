const CATEGORY_LENGTH = 6;
const SONG_LENGTH = 12;
var categoryLabels = null;
var categoryCircles = null;
var categoryImages = null;
var categoryContent = null;
var songLabels = null;
var songCircles = null;
var allCategoriesAudios = null;
var currentCategory = -1;
var currentCategorySongs = null;
var currentCategoryAudios = null;
var currentAudioPlayingIndex = -1;
const JSON_PATH = "file:///C:/repos/webplayer-gen4/library.json";

var musicPlayer = {
    container: document.getElementById("web-player"),
    categoryImage: document.getElementById("player-img"),
    categoryName: document.getElementById("player-name"),
    categoryDescription: document.getElementById("player-description"),
    songName: document.getElementById("song-name"),
    songDate: document.getElementById("song-date"),
    songClient: document.getElementById("song-client"),
    songDuration: document.getElementById("song-duration"),
    imagePlay: document.getElementById("img-button-play"),
    imagePause: document.getElementById("img-button-pause"),
    currentSong: null,
    isPlaying: false
}

var GetJSON = function(url, callback)
{
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function()
    {
        var status = xhr.status;
        if (status === 200 || status === 0)
        {
            callback(xhr.response);
        }
        else
        {
            alert('Something went wrong: ' + status);
        }
    };
    xhr.send();
};


function LoadApp()
{
    categoryLabels = document.querySelectorAll(".category-label");
    categoryCircles = document.querySelectorAll(".circle");
    categoryImages = document.querySelectorAll(".category-img");
    songLabels = document.querySelectorAll(".song-label");
    songCircles = document.querySelectorAll(".small-circle");
    musicPlayer.container.hidden = true;
    musicPlayer.imagePause.hidden = true;

    //GetJSON('file:///C:/repos/webplayer-gen4/library.json', JsonCallBack);
    JsonCallBack(jsonData);
}

var JsonCallBack = function(data)
{
    //let jsonContent = JSON.parse(data);
    let jsonContent = data;
    LoadCategories(jsonContent);
};

function LoadCategories(data)
{
    categoryContent = data.categories;
    if (categoryContent.length != CATEGORY_LENGTH)
    {
        alert("There was a problem loading categories. Loaded: " + categoryContent.length + ", expected: " + CATEGORY_LENGTH);
    }

    allCategoriesAudios = new Object();
    for (var i = 0; i < CATEGORY_LENGTH; i++)
    {
        categoryLabels[i].innerHTML = categoryContent[i].category_name;
        //alert(JSON.stringify(categoryContent));

        allCategoriesAudios[i] = new Object();
        var categorySongs = categoryContent[i].category_songs;
        for (var j = 0; j < categorySongs.length; j++)
        {
            allCategoriesAudios[i][j] = new Audio(categorySongs[j].song_path);
        }
    }

}

function SelectCategory(categoryIndex)
{
    if (currentCategory != -1)
    {
        categoryCircles[currentCategory].classList.remove("circle-selected");
    }

    if (currentCategory == categoryIndex)
    {
        musicPlayer.container.hidden = !musicPlayer.container.hidden;
        currentCategory = -1;
        StopPlaying();
        ClearSongLabels();
    }
    else
    {
        musicPlayer.container.hidden = false;
        currentCategory = categoryIndex;
        currentCategorySongs = categoryContent[currentCategory].category_songs;
        currentCategoryAudios = allCategoriesAudios[currentCategory];

        musicPlayer.categoryImage.src = categoryImages[currentCategory].src;
        musicPlayer.categoryName.innerHTML = categoryContent[currentCategory].category_name;
        musicPlayer.categoryDescription.innerHTML = categoryContent[currentCategory].category_description;
        ClearSongLabels();
        SetSongLabels(currentCategorySongs);
        SetCurrentSong(0);
    }

    if (currentCategory != -1)
    {
        categoryCircles[currentCategory].classList.add("circle-selected");
    }
}

function ClearSongLabels()
{
    for (var i = 0; i < SONG_LENGTH; i++)
    {
        songLabels[i].innerHTML = "------";
    }
}

function SetSongLabels(songData)
{
    for (var i = 0; i < songData.length; i++)
    {
        songLabels[i].innerHTML = songData[i].song_name;
    }
}

function SetCurrentSong(songIndex)
{
    if (currentAudioPlayingIndex != -1)
    {
        songCircles[currentAudioPlayingIndex].classList.remove("circle-selected");
    }
    songCircles[songIndex].classList.add("circle-selected");

    currentAudioPlayingIndex = songIndex;
    if (musicPlayer.currentSong != null)
    {
        StopPlaying();
    }
    if (currentCategoryAudios[songIndex] == undefined)
    {
        SetCurrentSong(0);
        return;
    }
    musicPlayer.currentSong = currentCategoryAudios[songIndex];
    musicPlayer.currentSong.currentTime = 0;
    musicPlayer.currentSong.onended = function()
    {
        PlayNextSong();
    };

    var currentSongData = currentCategorySongs[songIndex];
    musicPlayer.songName.innerHTML = currentSongData.song_name;
    musicPlayer.songDate.innerHTML = DateToString(currentSongData.song_date);
    musicPlayer.songClient.innerHTML = currentSongData.song_client;
    musicPlayer.songDuration.innerHTML = GetMinutesAndSeconds(musicPlayer.currentSong.duration);
    //PlayAudio();
}

function DateToString(date)
{
    if (date == null) return "1 de Enero de 1111";
    var tokens = date.split("/");
    if (tokens.length != 3)
    {
        alert("Wrong date format! It must be DD/MM/YYYY. Received: " + date);
    }
    return (tokens[0] + " de " + GetMonthName(tokens[1]) + " de " + tokens[2]);
}

function GetMonthName(monthNumber)
{
    var monthName = "";
    switch (monthNumber)
    {
        case "01":
            monthName = "Enero";
            break;
        case "02":
            monthName = "Febrero";
            break;
        case "03":
            monthName = "Marzo";
            break;
        case "04":
            monthName = "Abril";
            break;
        case "05":
            monthName = "Mayo";
            break;
        case "06":
            monthName = "Junio";
            break;
        case "07":
            monthName = "Julio";
            break;
        case "08":
            monthName = "Agosto";
            break;
        case "09":
            monthName = "Septiembre";
            break;
        case "10":
            monthName = "Octubre";
            break;
        case "11":
            monthName = "Noviembre";
            break;
        case "12":
            monthName = "Diciembre";
            break;
        default:
            monthName = "Error";
    }
    return monthName;
}

function GetMinutesAndSeconds(time)
{
    var minutes = Math.floor(time / 60);
    var seconds = Math.floor(time - (minutes * 60));
    return minutes + " minutos " + seconds + " segundos";
}

function PlayAudio()
{
    if (musicPlayer.currentSong != null)
    {
        if (!musicPlayer.isPlaying)
        {
            musicPlayer.currentSong.play();
            musicPlayer.imagePlay.hidden = true;
            musicPlayer.imagePause.hidden = false;
            //musicPlayerSongDuration.innerHTML = GetMinutesAndSeconds(musicPlayer.currentSong.duration);
            musicPlayer.isPlaying = true;
        }
        else
        {
            StopPlaying();
        }
    }
}

function StopPlaying()
{
    musicPlayer.imagePlay.hidden = false;
    musicPlayer.imagePause.hidden = true;
    musicPlayer.currentSong.pause();
    musicPlayer.isPlaying = false;
}

function PlayNextSong()
{
    if (currentAudioPlayingIndex == currentCategorySongs.length - 1)
    {
        SetCurrentSong(0);
        PlayAudio();
    }
    else
    {
        SetCurrentSong(currentAudioPlayingIndex + 1);
        PlayAudio();
    }
}

function PlayPreviousSong()
{
    if (musicPlayer.currentSong.currentTime < 3)
    {
        if (currentAudioPlayingIndex == 0)
        {
            SetCurrentSong(currentCategorySongs.length - 1);
            PlayAudio();
        }
        else
        {
            SetCurrentSong(currentAudioPlayingIndex - 1);
            PlayAudio();
        }
    }
    else
    {
        musicPlayer.currentSong.currentTime = 0;
    }
}

function DownloadSong()
{

}


var jsonData = {
    "categories": [
    {
        "category_name": "Amable",
        "category_description": "Aenean fermentum leo vitae est rutrum laoreet. Nullam posuere pellentesque volutpat. Duis feugiat lacinia lorem nec eleifend. Curabitur ac egestas enim. Duis in nibh a massa scelerisque imperdiet ac eu.	",
        "category_songs": [
        {
            "song_client": "Handsome Client",
            "song_artist": "Captive Portal",
            "song_name": "You can use",
            "song_path": "./songs/toy_sounds_volume/01_you_can_use.mp3",
            "song_date": "20/10/2016"
        },
        {
            "song_client": "client meh",
            "song_artist": "Captive Portal",
            "song_name": "Me as",
            "song_path": "./songs/toy_sounds_volume/02_me_as.mp3",
            "song_date": "05/05/2016"
        },
        {
            "song_client": "client ok",
            "song_artist": "Captive Portal",
            "song_name": "An example for",
            "song_path": "./songs/toy_sounds_volume/03_an_example_for.mp3",
            "song_date": "01/02/2012"
        },
        {
            "song_client": "client puta madre",
            "song_artist": "Captive Portal",
            "song_name": "A candy addiction",
            "song_path": "./songs/toy_sounds_volume/04_a_candy_addiction.mp3",
            "song_date": "01/09/2000"
        }]
    },
    {
        "category_name": "Natural",
        "category_description": "Interdum et malesuada fames ac ante ipsum primis in faucibus. Nam velit nisi, fermentum in metus id, consequat congue metus. Donec purus mauris, consequat et lectus sed, ultricies tincidunt justo",
        "category_songs": [
        {
            "song_client": "Amadeus Mozart",
            "song_artist": "Ketsa",
            "song_name": "Electric Sleep",
            "song_path": "./songs/ketsa_electric_sleep.mp3",
            "song_date": "01/09/2000"
        },
        {
            "song_client": "client puta madre",
            "song_artist": "Captive Portal",
            "song_name": "A candy addiction",
            "song_path": "./songs/toy_sounds_volume/04_a_candy_addiction.mp3",
            "song_date": "01/09/2000"
        }]
    },
    {
        "category_name": "Tirada",
        "category_description": "Donec pretium augue in dolor consequat fringilla eu eu erat. Duis tortor nisl, hendrerit quis ligula ac, ultrices hendrerit nunc. Interdum et malesuada fames ac ante ipsum primis in faucibus.",
        "category_songs": [
        {
            "song_client": "",
            "song_artist": "",
            "song_name": "",
            "song_path": ""
        }]
    },
    {
        "category_name": "Testimonial",
        "category_description": "Aenean enim mauris, suscipit in neque ac, dignissim faucibus enim. Sed porttitor turpis sed lorem sodales mollis. Cras sed dolor feugiat, commodo orci non, accumsan nibh. Aliquam fringilla sem vel.",
        "category_songs": [
        {
            "song_client": "",
            "song_artist": "",
            "song_name": "",
            "song_path": ""
        }]
    },
    {
        "category_name": "Corporativa",
        "category_description": "Nulla tincidunt tellus id suscipit tristique. Aenean metus sem, tincidunt condimentum sagittis quis, dapibus et nisi. Nulla imperdiet turpis sed rutrum porta. Integer id lorem a sem bibendum congue non.",
        "category_songs": [
        {
            "song_client": "",
            "song_artist": "",
            "song_name": "",
            "song_path": ""
        }]
    },
    {
        "category_name": "Promo",
        "category_description": "Sed convallis justo quis suscipit interdum. Mauris lobortis mi sed est porttitor rhoncus. Donec id nisl porttitor, accumsan dolor eget, varius massa. Nunc auctor turpis non risus laoreet tristique. Praesent",
        "category_songs": [
        {
            "song_client": "",
            "song_artist": "",
            "song_name": "",
            "song_path": ""
        }]
    }]
};