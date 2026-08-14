(function () {
  "use strict";

  var tracks = PLAYLIST.slice();
  var shuffled = shuffle(tracks);

  var state = {
    tracks: shuffled,
    index: 0,
    playing: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
    bgIndex: 0,
    bgHover: null,
    bgPressSide: null,
    bgPressTimeout: null,
    bgHeld: false,
    fullscreen: false,
    menuOpen: false,
    panelOpen: false
  };

  var audio = document.getElementById("audio");
  var coverImage = document.getElementById("coverImage");
  var cdDisk = document.getElementById("cdDisk");
  var trackTitle = document.getElementById("trackTitle");
  var trackArtist = document.getElementById("trackArtist");
  var timeDisplay = document.getElementById("timeDisplay");
  var progressBar = document.getElementById("progressBar");
  var audioWave = document.getElementById("audioWave");
  var playIcon = document.getElementById("playIcon");
  var pauseIcon = document.getElementById("pauseIcon");
  var playBtn = document.getElementById("playBtn");
  var prevBtn = document.getElementById("prevBtn");
  var nextBtn = document.getElementById("nextBtn");
  var volumeSlider = document.getElementById("volumeSlider");
  var muteBtn = document.getElementById("muteBtn");
  var fullscreenBtn = document.getElementById("fullscreenBtn");
  var fullscreenIconIn = document.getElementById("fullscreenIconIn");
  var fullscreenIconOut = document.getElementById("fullscreenIconOut");
  var onlineCount = document.getElementById("onlineCount");
  var onlineLabel = document.getElementById("onlineLabel");
  var realTime = document.getElementById("realTime");
  var toast = document.getElementById("toast");
  var toastTimer = null;

  var desktopBgs = Array.prototype.slice.call(document.querySelectorAll(".desktop-bgs .background-image"));
  var mobileBgs = Array.prototype.slice.call(document.querySelectorAll(".mobile-bgs .background-image"));
  var navLeft = document.getElementById("navLeft");
  var navRight = document.getElementById("navRight");

  var navMenuBtn = document.getElementById("navMenuBtn");
  var navMenuPanel = document.getElementById("navMenuPanel");
  var navMenuList = document.getElementById("navMenuList");
  var navMenuLabel = document.getElementById("navMenuLabel");

  var playlistBackdrop = document.getElementById("playlistBackdrop");
  var playlistPanel = document.getElementById("playlistPanel");
  var playlistList = document.getElementById("playlistList");
  var playlistClose = document.getElementById("playlistClose");
  var coverBtn = document.getElementById("coverBtn");
  var trackDetails = document.getElementById("trackDetails");

  var welcomeOverlay = document.getElementById("welcomeOverlay");
  var welcomeBackdrop = document.getElementById("welcomeBackdrop");
  var welcomeClose = document.getElementById("welcomeClose");

  var currentTrack = function () {
    return state.tracks[state.index];
  };

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var r = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[r];
      a[r] = tmp;
    }
    return a;
  }

  function formatTime(sec) {
    if (!isFinite(sec) || isNaN(sec)) return "0:00";
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60).toString().padStart(2, "0");
    return m + ":" + s;
  }

  /* ============ Track loading / playback ============ */

  function loadTrack() {
    var t = currentTrack();
    if (!t) return;
    audio.src = t.url;
    trackTitle.textContent = t.title;
    trackArtist.textContent = t.artist;
    coverImage.src = t.thumbnail || "";
    audio.currentTime = 0;
    updatePlayButton();
    renderPlaylist();
    if (state.playing) {
      audio.play().catch(function () {});
    }
  }

  function togglePlay() {
    if (state.tracks.length === 0) return;
    if (audio.paused) {
      state.playing = true;
      audio.play().catch(function () {});
    } else {
      state.playing = false;
      audio.pause();
    }
    updatePlayButton();
  }

  function skip(dir) {
    if (state.tracks.length === 0) return;
    state.index = (state.index + dir + state.tracks.length) % state.tracks.length;
    state.currentTime = 0;
    loadTrack();
    if (state.playing) {
      setTimeout(function () {
        audio.play().catch(function () {});
      }, 50);
    }
  }

  function updatePlayButton() {
    var isPlaying = !audio.paused;
    playIcon.style.display = isPlaying ? "none" : "block";
    pauseIcon.style.display = isPlaying ? "block" : "none";
    cdDisk.classList.toggle("playing", isPlaying);
    audioWave.style.display = isPlaying && currentTrack() ? "flex" : "none";
    if (audioWave.style.display === "flex") {
      var bars = audioWave.children;
      for (var i = 0; i < bars.length; i++) {
        bars[i].style.animationPlayState = "running";
      }
    }
  }

  audio.addEventListener("timeupdate", function () {
    state.currentTime = audio.currentTime;
    updateProgressUI();
  });

  audio.addEventListener("loadedmetadata", function () {
    state.duration = audio.duration === Infinity ? 0 : audio.duration;
    updateProgressUI();
  });

  audio.addEventListener("play", function () {
    state.playing = true;
    updatePlayButton();
  });

  audio.addEventListener("pause", function () {
    state.playing = false;
    updatePlayButton();
  });

  audio.addEventListener("ended", function () {
    skip(1);
  });

  audio.addEventListener("error", function () {
    if (state.playing) {
      setTimeout(function () {
        skip(1);
      }, 2000);
    }
  });

  audio.volume = state.volume;

  function updateProgressUI() {
    var dur = state.duration || currentTrack() && currentTrack().duration || 100;
    if (dur <= 0) dur = 100;
    var cur = Math.min(state.currentTime, dur);
    timeDisplay.textContent = formatTime(state.currentTime) + " / " + formatTime(dur);
    progressBar.max = dur;
    progressBar.value = cur;
    var pct = (cur / dur) * 100;
    progressBar.style.background =
      "linear-gradient(to right, #ffffff " + pct + "%, rgba(255,255,255,0.2) " + pct + "%)";
  }

  progressBar.addEventListener("input", function () {
    var val = parseFloat(progressBar.value);
    if (audio) {
      audio.currentTime = val;
      state.currentTime = val;
      updateProgressUI();
    }
  });

  playBtn.addEventListener("click", togglePlay);
  prevBtn.addEventListener("click", function () {
    skip(-1);
  });
  nextBtn.addEventListener("click", function () {
    skip(1);
  });

  /* ============ Volume ============ */

  volumeSlider.addEventListener("input", function () {
    state.volume = parseFloat(volumeSlider.value) / 100;
    audio.volume = state.volume;
    state.muted = state.volume === 0;
  });

  muteBtn.addEventListener("click", function () {
    if (state.muted) {
      state.muted = false;
      state.volume = state.volume === 0 ? 1 : state.volume;
      audio.volume = state.volume;
      volumeSlider.value = state.volume * 100;
    } else {
      state.muted = true;
      audio.volume = 0;
      volumeSlider.value = 0;
    }
  });

  /* ============ Backgrounds ============ */

  function setBgIndex(idx) {
    state.bgIndex = (idx + desktopBgs.length) % desktopBgs.length;
    desktopBgs.forEach(function (img, i) {
      img.classList.toggle("active", i === state.bgIndex);
    });
    mobileBgs.forEach(function (img, i) {
      img.classList.toggle("active", i === (state.bgIndex % mobileBgs.length));
    });
  }

  function advanceBg(dir) {
    setBgIndex(state.bgIndex + dir);
  }

  var bgAutoInterval = setInterval(function () {
    if (!state.bgPressSide) {
      advanceBg(1);
    }
  }, 600000);

  function onBgPress(side, ev) {
    if (ev && ev.button !== 0 && ev.pointerType === "mouse") return;
    state.bgPressSide = side;
    if (side === "left") navLeft.classList.add("pressing");
    else navRight.classList.add("pressing");
    if (state.bgPressTimeout) clearTimeout(state.bgPressTimeout);
    state.bgPressTimeout = setTimeout(function () {
      state.bgHeld = true;
      clearBgPress(side);
    }, 800);
  }

  function onBgRelease(side) {
    if (state.bgPressTimeout) {
      clearTimeout(state.bgPressTimeout);
      state.bgPressTimeout = null;
      if (state.bgPressSide === side && !state.bgHeld) {
        advanceBg(side === "left" ? -1 : 1);
      }
    }
    clearBgPress(side);
  }

  function clearBgPress(side) {
    state.bgPressSide = null;
    state.bgHeld = false;
    navLeft.classList.remove("pressing");
    navRight.classList.remove("pressing");
  }

  function setupNavZone(zone, side) {
    zone.addEventListener("mouseenter", function () {
      zone.classList.add("hovered");
    });
    zone.addEventListener("mouseleave", function () {
      zone.classList.remove("hovered");
      clearBgPress(side);
    });
    zone.addEventListener("pointerdown", function (ev) {
      onBgPress(side, ev);
    });
    zone.addEventListener("pointerup", function () {
      onBgRelease(side);
    });
    zone.addEventListener("pointercancel", function () {
      onBgRelease(side);
    });
    zone.addEventListener("contextmenu", function (ev) {
      ev.preventDefault();
    });
  }

  setupNavZone(navLeft, "left");
  setupNavZone(navRight, "right");

  /* ============ Fullscreen ============ */

  fullscreenBtn.addEventListener("click", function () {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(function () {});
    } else {
      document.documentElement.requestFullscreen().catch(function () {});
    }
  });

  document.addEventListener("fullscreenchange", function () {
    state.fullscreen = !!document.fullscreenElement;
    fullscreenIconIn.style.display = state.fullscreen ? "none" : "block";
    fullscreenIconOut.style.display = state.fullscreen ? "block" : "none";
  });

  /* ============ Nav menu (playlists) ============ */

  var PLAYLISTS = [
    { id: "papa-ke-jamane-ke-gaane", label: "Papa Ke Jamane Ke Gaane", icon: "chevron-down", color: "#A06CD5" },
    { id: "bartan-time", label: "Bartan Time", icon: "utensils", color: "#FF6B6B" },
    { id: "2009-vibes", label: "2009s Vibes", icon: "music", color: "#4ade80" },
    { id: "genz-gaane", label: "Genz Gaane", icon: "zap", color: "#fbbf24" },
    { id: "neendi-time", label: "Neendi Time", icon: "moon", color: "#818cf8" },
    { id: "gym-jam", label: "Gym Jam", icon: "dumbbell", color: "#ef4444" },
    { id: "bihari-banger", label: "Bihari Banger", icon: "flame", color: "#f97316" },
    { id: "chatpate-songs", label: "Chatpate Songs", icon: "sparkles", color: "#ec4899" },
    { id: "tamil-hits", label: "Tamil Hits", icon: "disc", color: "#14b8a6" },
    { id: "punjabi-tadka", label: "Punjabi Tadka", icon: "mic-vocal", color: "#eab308" },
    { id: "the-great-kk", label: "The Great KK", icon: "mic", color: "#3b82f6" },
    { id: "shadi-samarav", label: "Shadi Samarav", icon: "heart", color: "#f43f5e" },
    { id: "dhh-gym-hardcore", label: "DHH Gym Hardcore", icon: "dumbbell", color: "#dc2626" },
    { id: "dhh-lonely-songs", label: "DHH Lonely Songs", icon: "moon", color: "#9333ea" },
    { id: "tu-aisa-kaise-hai", label: "Tu Aisa Kaise Hai", icon: "heart", color: "#f43f5e" },
    { id: "legend-never-dies", label: "Legend Never Dies", icon: "flame", color: "#f97316" },
    { id: "trending-phonks", label: "Trending Phonks", icon: "zap", color: "#fbbf24" },
    { id: "marathi-hits", label: "Marathi Hits", icon: "disc", color: "#14b8a6" },
    { id: "arijit-singh", label: "Arijit Singh", icon: "mic-vocal", color: "#3b82f6" },
    { id: "lofi-study", label: "Lofi Study", icon: "moon", color: "#818cf8" },
    { id: "bathroom-playlist", label: "Bathroom Playlist", icon: "sparkles", color: "#06b6d4" },
    { id: "sad-drunk", label: "Sad Drunk", icon: "music", color: "#64748b" },
    { id: "dhh-drillin", label: "DHH Drillin", icon: "dumbbell", color: "#ef4444" }
  ];

  var ICON_PATHS = {
    "chevron-down": '<path d="m6 9 6 6 6-6"></path>',
    utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>',
    music: '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>',
    zap: '<path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z"></path>',
    moon: '<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"></path>',
    dumbbell: '<path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z"></path><path d="m2.5 21.5 1.4-1.4"></path><path d="m20.1 3.9 1.4-1.4"></path><path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z"></path><path d="m9.6 14.4 4.8-4.8"></path>',
    flame: '<path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"></path>',
    sparkles: '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"></path><path d="M20 2v4"></path><path d="M22 4h-4"></path><circle cx="4" cy="20" r="2"></circle>',
    disc: '<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="2"></circle>',
    "mic-vocal": '<path d="m11 7.601-5.994 8.19a1 1 0 0 0 .1 1.298l.817.818a1 1 0 0 0 1.314.087L15.09 12"></path><path d="M16.5 21.174C15.5 20.5 14.372 20 13 20c-2.058 0-3.928 2.356-6 2-2.072-.356-2.775-3.369-1.5-4.5"></path><circle cx="16" cy="7" r="5"></circle>',
    mic: '<path d="M12 19v3"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><rect x="9" y="2" width="6" height="13" rx="3"></rect>',
    heart: '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"></path>'
  };

  function iconSvg(icon, color) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICON_PATHS[icon] || "") + "</svg>";
  }

  function renderNavMenu() {
    navMenuList.innerHTML = "";
    PLAYLISTS.forEach(function (pl) {
      var item = document.createElement("button");
      item.className = "nav-menu-item";
      item.setAttribute("type", "button");
      item.innerHTML =
        '<span class="item-icon">' +
        iconSvg(pl.icon, pl.color) +
        "</span><span>" +
        pl.label +
        "</span>";
      item.addEventListener("click", function () {
        closeMenu();
        if (pl.id === "bartan-time") {
          togglePanel(true);
        } else {
          showToast("Only Bartan Time is included in this offline copy");
        }
      });
      navMenuList.appendChild(item);
    });
  }

  function openMenu() {
    state.menuOpen = true;
    navMenuPanel.style.display = "block";
    navMenuBtn.classList.add("open");
    navMenuBtn.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    state.menuOpen = false;
    navMenuPanel.style.display = "none";
    navMenuBtn.classList.remove("open");
    navMenuBtn.setAttribute("aria-expanded", "false");
  }

  navMenuBtn.addEventListener("click", function (ev) {
    ev.stopPropagation();
    if (state.menuOpen) closeMenu();
    else openMenu();
  });

  document.addEventListener("pointerdown", function (ev) {
    var wrap = document.getElementById("navMenu");
    if (state.menuOpen && wrap && !wrap.contains(ev.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") {
      closeMenu();
      if (state.panelOpen) setPanel(false);
    }
  });

  /* ============ Playlist panel ============ */

  function renderPlaylist() {
    playlistList.innerHTML = "";
    state.tracks.forEach(function (t, i) {
      var item = document.createElement("div");
      item.className = "playlist-item" + (i === state.index ? " active" : "");
      item.setAttribute("role", "button");

      var num = document.createElement("span");
      num.className = "playlist-num";
      num.textContent = i + 1;

      var title = document.createElement("span");
      title.className = "playlist-title";
      title.textContent = t.title;

      item.appendChild(num);
      item.appendChild(title);

      if (i === state.index && state.playing) {
        var wave = document.createElement("span");
        wave.className = "now-wave";
        wave.innerHTML = "<span></span><span></span><span></span>";
        item.appendChild(wave);
      }

      item.addEventListener("click", function () {
        state.index = i;
        state.currentTime = 0;
        loadTrack();
        setPanel(false);
        setTimeout(function () {
          state.playing = true;
          audio.play().catch(function () {});
        }, 50);
      });

      playlistList.appendChild(item);
    });
  }

  function setPanel(open) {
    state.panelOpen = open;
    playlistBackdrop.style.display = open ? "block" : "none";
    playlistPanel.style.display = open ? "flex" : "none";
  }

  function togglePanel(force) {
    setPanel(force !== undefined ? force : !state.panelOpen);
  }

  coverBtn.addEventListener("click", function () {
    togglePanel();
  });
  trackDetails.addEventListener("click", function () {
    togglePanel();
  });
  playlistClose.addEventListener("click", function () {
    setPanel(false);
  });
  playlistBackdrop.addEventListener("click", function () {
    setPanel(false);
  });

  /* ============ Toast ============ */

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("show");
    }, 2200);
  }

  /* ============ Welcome popup ============ */

  function closeWelcome() {
    welcomeOverlay.style.display = "none";
    sessionStorage.setItem("nostalgia_visited", "true");
  }

  welcomeClose.addEventListener("click", closeWelcome);
  welcomeBackdrop.addEventListener("click", closeWelcome);

  (function initWelcome() {
    if (!sessionStorage.getItem("nostalgia_visited")) {
      setTimeout(function () {
        welcomeOverlay.style.display = "flex";
      }, 2500);
    }
  })();

  /* ============ Clock ============ */

  function tickClock() {
    var now = new Date();
    var h = now.getHours();
    var m = now.getMinutes().toString().padStart(2, "0");
    var h12 = h % 12 === 0 ? 12 : h % 12;
    var ampm = h < 12 ? "AM" : "PM";
    realTime.textContent = h12 + ":" + m + " " + ampm;
  }

  tickClock();
  setInterval(tickClock, 1000);

  /* ============ Online count ============ */

  function updateOnline(count) {
    var n = parseInt(count, 10);
    if (isNaN(n) || n < 0) return;
    onlineCount.textContent = n;
    onlineLabel.textContent = n === 1 ? "person online" : "people online";
  }

  function pingOnline() {
    var sessionId = localStorage.getItem("session_id");
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem("session_id", sessionId);
    }
    var req = new XMLHttpRequest();
    req.open("GET", "https://nostalgia-song-l3lt.onrender.com/ping?id=" + encodeURIComponent(sessionId));
    req.timeout = 10000;
    req.onreadystatechange = function () {
      if (req.readyState === 4 && req.status === 200) {
        try {
          var data = JSON.parse(req.responseText);
          if (data && typeof data.online === "number") {
            updateOnline(data.online);
            return;
          }
        } catch (e) {}
      }
      updateOnline(Math.floor(50 * Math.random()) + 85);
    };
    req.onerror = function () {
      updateOnline(Math.floor(50 * Math.random()) + 85);
    };
    req.send();
  }

  pingOnline();
  setInterval(pingOnline, 30000);

  /* ============ Wake lock ============ */

  var wakeLockRef = null;

  function requestWakeLock() {
    if (navigator.wakeLock && "request" in navigator.wakeLock) {
      navigator.wakeLock.request("screen").then(function (lock) {
        wakeLockRef = lock;
      }).catch(function () {});
    }
  }

  function releaseWakeLock() {
    if (wakeLockRef && wakeLockRef.release) {
      wakeLockRef.release().catch(function () {});
      wakeLockRef = null;
    }
  }

  function manageWakeLock() {
    if (state.playing || state.fullscreen) requestWakeLock();
    else releaseWakeLock();
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && (state.playing || state.fullscreen)) {
      requestWakeLock();
    }
  });

  /* ============ Init ============ */

  renderNavMenu();
  setBgIndex(0);
  loadTrack();
  updateProgressUI();
  manageWakeLock();

  setInterval(manageWakeLock, 30000);

  document.addEventListener("play", function () {
    manageWakeLock();
  });
  document.addEventListener("pause", function () {
    manageWakeLock();
  });
})();
