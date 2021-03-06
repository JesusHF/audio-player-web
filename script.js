const CATEGORY_LENGTH = 6;
const SONG_LENGTH = 12;
const JSON_PATH = "https://jesushfdev.com/audio-player-web/library.json";
const VOLUME_LEVELS = [1, 0.66, 0.33, 0];
const VOLUME_ICONS = [
  "img/icons/vol-100.png",
  "img/icons/vol-66.png",
  "img/icons/vol-33.png",
  "img/icons/vol-0.png",
];

var categoryContent = null;
var allCategoriesAudios = null;
var currentCategory = -1;
var currentCategorySongs = null;
var currentCategoryAudios = null;
var currentAudioPlayingIndex = -1;
var currentCategoryPageMax = 1;
var currentCategoryPage = 0;

var musicApp = {
  categoryImages: document.querySelectorAll(".category-img"),
  categoryLabels: document.querySelectorAll(".category-label"),
  categoryCircles: document.querySelectorAll(".circle"),
  songLabels: document.querySelectorAll(".song-label"),
  songCircles: document.querySelectorAll(".small-circle"),
};

var musicPlayer = {
  container: document.getElementById("web-player"),
  categoryImage: document.getElementById("player-img"),
  categoryName: document.getElementById("player-name"),
  categoryDescription: document.getElementById("player-description"),
  songBar: document.getElementById("song-bar"),
  songName: document.getElementById("song-name"),
  songDate: document.getElementById("song-date"),
  songArtist: document.getElementById("song-artist"),
  songAlbum: document.getElementById("song-album"),
  songDuration: document.getElementById("song-duration"),
  imagePlay: document.getElementById("img-button-play"),
  imagePause: document.getElementById("img-button-pause"),
  imageVolume: document.getElementById("img-button-volume"),
  volumeLevel: 0,
  currentSong: null,
  isPlaying: false,
  updateInterval: null,
};

var GetJSON = (url, callback) => {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.responseType = "json";
  xhr.onload = () => {
    var status = xhr.status;
    if (status === 200 || status === 0) {
      callback(xhr.response);
    } else {
      alert("Something went wrong: " + status);
    }
  };
  xhr.send();
};

function LoadApp() {
  musicPlayer.imagePause.hidden = true;

  GetJSON(JSON_PATH, (jsonContent) => {
    LoadCategories(jsonContent);
  });
}

function LoadCategories(jsonContent) {
  categoryContent = jsonContent.categories;
  if (categoryContent.length != CATEGORY_LENGTH) {
    alert(
      "There was a problem loading categories. Loaded: " +
        categoryContent.length +
        ", expected: " +
        CATEGORY_LENGTH
    );
    return;
  }

  allCategoriesAudios = new Object();
  for (var i = 0; i < CATEGORY_LENGTH; i++) {
    musicApp.categoryImages[i].innerHTML = categoryContent[i].category_img;
    musicApp.categoryLabels[i].innerHTML = categoryContent[i].category_name;

    allCategoriesAudios[i] = new Object();
    var categorySongs = categoryContent[i].category_songs;
    for (var j = 0; j < categorySongs.length; j++) {
      allCategoriesAudios[i][j] = new Audio(categorySongs[j].song_path);
    }
  }
}

function SelectCategory(categoryIndex) {
  if (currentCategory != -1) {
    musicApp.categoryCircles[currentCategory].classList.remove("circle-selected");
  }

  if (currentCategory != categoryIndex) {
    musicPlayer.container.hidden = false;
    currentCategory = categoryIndex;
    currentCategorySongs = categoryContent[currentCategory].category_songs;
    currentCategoryAudios = allCategoriesAudios[currentCategory];
    currentCategoryPageMax = Math.ceil(currentCategorySongs.length / musicApp.songLabels.length);
    currentCategoryPage = 0;

    musicPlayer.categoryImage.innerHTML = musicApp.categoryImages[categoryIndex].innerHTML;
    musicPlayer.categoryName.innerHTML = categoryContent[currentCategory].category_name;
    musicPlayer.categoryDescription.innerHTML =
      categoryContent[currentCategory].category_description;
    ClearSongLabels();
    SetSongLabels(currentCategorySongs);
    SetCurrentSong(0, false);
  }

  if (currentCategory != -1) {
    musicApp.categoryCircles[currentCategory].classList.add("circle-selected");
  }
}

function ClearSongLabels() {
  for (var i = 0; i < SONG_LENGTH; i++) {
    musicApp.songLabels[i].innerHTML = "------";
    musicApp.songCircles[i].classList.remove("circle-selected");
  }
}

function SetSongLabels(songData, page = 0) {
  let start = page * musicApp.songLabels.length;
  for (var i = start; i < start + musicApp.songLabels.length; i++) {
    if (i < songData.length) {
      let name = songData[i].song_name;
      if (songData[i].song_name.length > 22) {
        name = name.slice(0, 19) + "...";
      }
      musicApp.songLabels[i - start].innerHTML = name;
    }
  }
}

function SetCurrentSong(songIndex, playSong = true) {
  if (currentCategoryAudios[songIndex] == undefined) {
    return;
  }
  let pageOffset = currentCategoryPage * musicApp.songLabels.length;
  if (currentAudioPlayingIndex != -1) {
    musicApp.songCircles[currentAudioPlayingIndex % musicApp.songLabels.length].classList.remove(
      "circle-selected"
    );
  }
  musicApp.songCircles[songIndex].classList.add("circle-selected");

  currentAudioPlayingIndex = songIndex + pageOffset;
  if (musicPlayer.currentSong != null) {
    StopPlaying();
  }
  musicPlayer.currentSong = currentCategoryAudios[currentAudioPlayingIndex];
  musicPlayer.currentSong.currentTime = 0;
  musicPlayer.currentSong.volume = VOLUME_LEVELS[musicPlayer.volumeLevel];
  musicPlayer.currentSong.onended = () => {
    PlayNextSong();
  };

  var currentSongData = currentCategorySongs[currentAudioPlayingIndex];
  musicPlayer.songName.innerHTML = currentSongData.song_name;
  musicPlayer.songDate.innerHTML = DateToString(currentSongData.song_date);
  musicPlayer.songArtist.innerHTML = currentSongData.song_artist;
  musicPlayer.songAlbum.innerHTML = currentSongData.song_album;
  musicPlayer.songDuration.innerHTML = GetMinutesAndSeconds(musicPlayer.currentSong.duration);
  if (playSong) {
    PlayAudio();
  }
}

function DateToString(date) {
  if (date == null) return "January 1, 2021";
  var tokens = date.split("/");
  if (tokens.length != 3) {
    alert("Wrong date format! It must be DD/MM/YYYY. Received: " + date);
  }
  return GetMonthName(tokens[1]) + " " + tokens[0] + ", " + tokens[2];
}

function GetMonthName(monthNumber) {
  var monthName = "";
  switch (monthNumber) {
    case "01":
      monthName = "January";
      break;
    case "02":
      monthName = "February";
      break;
    case "03":
      monthName = "March";
      break;
    case "04":
      monthName = "April";
      break;
    case "05":
      monthName = "May";
      break;
    case "06":
      monthName = "June";
      break;
    case "07":
      monthName = "July";
      break;
    case "08":
      monthName = "August";
      break;
    case "09":
      monthName = "September";
      break;
    case "10":
      monthName = "October";
      break;
    case "11":
      monthName = "November";
      break;
    case "12":
      monthName = "December";
      break;
    default:
      monthName = "Error";
  }
  return monthName;
}

function GetMinutesAndSeconds(time) {
  var minutes = Math.floor(time / 60);
  var seconds = Math.floor(time - minutes * 60);
  return minutes + " minutes " + seconds + " seconds";
}

function PlayAudio() {
  if (musicPlayer.currentSong != null) {
    if (!musicPlayer.isPlaying) {
      musicPlayer.currentSong.play();
      musicPlayer.imagePlay.hidden = true;
      musicPlayer.imagePause.hidden = false;
      musicPlayer.isPlaying = true;
      SetSongUpdating(true);
    } else {
      StopPlaying();
    }
  }
}

function StopPlaying() {
  musicPlayer.imagePlay.hidden = false;
  musicPlayer.imagePause.hidden = true;
  musicPlayer.currentSong.pause();
  musicPlayer.isPlaying = false;
  SetSongUpdating(false);
}

function PlayNextSong() {
  if (musicPlayer.currentSong != null) {
    var minIndex = Math.min(currentCategorySongs.length - 1, musicApp.songLabels.length - 1);
    if (currentAudioPlayingIndex == minIndex) {
      SetCurrentSong(0, true);
    } else {
      SetCurrentSong(currentAudioPlayingIndex + 1, true);
    }
  }
}

function PlayPreviousSong() {
  if (musicPlayer.currentSong != null) {
    if (musicPlayer.currentSong.currentTime < 3) {
      if (currentAudioPlayingIndex == 0) {
        var minIndex = Math.min(currentCategorySongs.length - 1, musicApp.songLabels.length - 1);
        SetCurrentSong(minIndex, true);
      } else {
        SetCurrentSong(currentAudioPlayingIndex - 1, true);
      }
    } else {
      musicPlayer.currentSong.currentTime = 0;
    }
  }
}

function ChangeVolume() {
  var level = musicPlayer.volumeLevel + 1;
  if (level == VOLUME_LEVELS.length) {
    level = 0;
  }
  musicPlayer.imageVolume.src = VOLUME_ICONS[level];
  musicPlayer.volumeLevel = level;
  if (musicPlayer.currentSong != null) {
    musicPlayer.currentSong.volume = VOLUME_LEVELS[musicPlayer.volumeLevel];
  }
}

function ResetVolumeImage() {
  musicPlayer.imageVolume.src = VOLUME_ICONS[0];
}

function PageRight() {
  if (currentCategoryPage < currentCategoryPageMax - 1) {
    currentCategoryPage += 1;
    ClearSongLabels();
    SetSongLabels(currentCategorySongs, currentCategoryPage);
    SetCurrentSong(0, true);
  }
}

function PageLeft() {
  if (currentCategoryPage > 0) {
    currentCategoryPage -= 1;
    ClearSongLabels();
    SetSongLabels(currentCategorySongs, currentCategoryPage);
    SetCurrentSong(0, true);
  }
}

function SetSongUpdating(update = true) {
  if (update) {
    UpdateSong();
    musicPlayer.updateInterval = setInterval(UpdateSong, 100);
    StartPathAnimation();
  } else {
    clearInterval(musicPlayer.updateInterval);
    musicPlayer.updateInterval = null;
    UpdateSong();
  }
}

function UpdateSong() {
  let songPosition = musicPlayer.currentSong.currentTime;
  let songDuration = musicPlayer.currentSong.duration;
  let percentage = (songDuration - songPosition) * (100 / songDuration);
  musicPlayer.songBar.style.width = percentage + "%";

  let path = document.querySelector("#player-info .svg-stroke:nth-child(2)");
  let length = path.getTotalLength();
  path.style.strokeDashoffset = (percentage / 100) * length;
}

function StartPathAnimation() {
  let path = document.querySelector("#player-info .svg-stroke:nth-child(2)");
  let length = path.getTotalLength();
  // Set up the starting positions
  path.style.strokeDasharray = length + " " + length;
  path.style.strokeDashoffset = "0";
}
