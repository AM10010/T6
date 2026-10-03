/* Omar & Laila — vanilla JS interactions (no dependencies) */
(function () {
  "use strict";

  function init() {
    buildCalendar();
    startCountdown();
    setupReveal();
    setupVoiceNote();
    setupForm();
    setupGate();
  }

  /* ---------- July 2026 calendar (Mon-first, 25th highlighted) -------- */
  function buildCalendar() {
    var grid = document.getElementById("calendar-grid");
    if (!grid) return;
    var year = 2026;
    var month = 7; // August (0-based)
    var first = new Date(year, month, 1);
    var offset = (first.getDay() + 6) % 7; // Monday = 0
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var html = "";
    for (var i = 0; i < offset; i++) html += "<span></span>";
    for (var d = 1; d <= daysInMonth; d++) {
      var cls = d === 25 ? "is-day is-wedding" : "is-day";
      html += '<span class="' + cls + '">' + d + "</span>";
    }
    grid.innerHTML = html;
  }

  /* ---------- countdown ---------------------------------------------- */
 function startCountdown() {
    var root = document.getElementById("countdown");
    if (!root) return;
    var target = new Date(root.getAttribute("data-date")).getTime();
    var out = {
      days: root.querySelector("[data-days]"),
      hours: root.querySelector("[data-hours]"),
      minutes: root.querySelector("[data-minutes]"),
      seconds: root.querySelector("[data-seconds]"),
    };

    function pad(n) {
      return (n < 10 ? "0" : "") + n;
    }

    function tick() {
      var diff = Math.max(0, target - Date.now());
      var total = Math.floor(diff / 1000);
      out.days.textContent = pad(Math.floor(total / 86400));
      out.hours.textContent = pad(Math.floor((total % 86400) / 3600));
      out.minutes.textContent = pad(Math.floor((total % 3600) / 60));
      out.seconds.textContent = pad(total % 60);
    }

    tick();
    setInterval(tick, 1000);
}

  /* ---------- scroll reveal ------------------------------------------ */
  function setupReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      for (var i = 0; i < items.length; i++) items[i].classList.add("is-visible");
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    items.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ---------- voice note (visual only, no audio file) ----------------- */
  function setupVoiceNote() {
    var wave = document.getElementById("voice-wave");
    var btn = document.getElementById("voice-play");
    var current = document.getElementById("voice-current");
    if (!wave || !btn) return;

    var bars = 64;
    var html = "";
    for (var i = 0; i < bars; i++) {
      var h = 18 + Math.abs(Math.sin(i * 0.7)) * 60 + (i % 3) * 6;
      html += '<i style="--h:' + h.toFixed(0) + "%;--d:" + (i % 8) * 0.08 + 's"></i>';
    }
    wave.innerHTML = html;

    var playing = false;
    var seconds = 0;
    var timer = null;

    function render() {
      var m = Math.floor(seconds / 60);
      var s = seconds % 60;
      current.textContent = m + ":" + (s < 10 ? "0" : "") + s;
    }

    btn.addEventListener("click", function () {
      playing = !playing;
      wave.classList.toggle("is-playing", playing);
      btn.classList.toggle("is-playing", playing);
      btn.setAttribute("aria-label", playing ? "Pause voice note" : "Play voice note");
      if (playing) {
        timer = setInterval(function () {
          seconds += 1;
          if (seconds >= 368) {
            seconds = 0;
            btn.click();
            return;
          }
          render();
        }, 1000);
      } else {
        clearInterval(timer);
      }
    });
  }


  /* ---------- entrance gate + music toggle ---------------------------- */
  function setupGate() {
    var gate = document.getElementById("gate");
    var enterBtn = document.getElementById("enterBtn");
    var player = document.getElementById("musicPlayer");
    var playBtn = document.getElementById("playBtn");
    var track = document.getElementById("track");
    if (!gate || !enterBtn || !track) return;

    var iconPlay = playBtn.querySelector(".icon-play");
    var iconPause = playBtn.querySelector(".icon-pause");

    function render() {
      var playing = !track.paused;
      iconPlay.style.display = playing ? "none" : "";
      iconPause.style.display = playing ? "" : "none";
      playBtn.setAttribute("aria-label", playing ? "Pause music" : "Play music");
    }

    enterBtn.addEventListener("click", function () {
      gate.classList.add("is-open");
      document.body.classList.remove("is-locked");
      player.hidden = false;
      var attempt = track.play();
      if (attempt && attempt.then) attempt.then(render).catch(render);
      else render();
      setTimeout(function () {
        gate.setAttribute("hidden", "hidden");
      }, 900);
    });

    playBtn.addEventListener("click", function () {
      if (track.paused) {
        var attempt = track.play();
        if (attempt && attempt.then) attempt.then(render).catch(render);
        else render();
      } else {
        track.pause();
        render();
      }
    });

    track.addEventListener("play", render);
    track.addEventListener("pause", render);
    render();
  }

  /* ---------- RSVP form: client-side validation only ------------------ */
  function setupForm() {
    var form = document.getElementById("rsvp-form");
    if (!form) return;
    var success = document.getElementById("rsvp-success");

    function setError(name, message) {
      var box = form.querySelector('[data-error-for="' + name + '"]');
      if (box) box.textContent = message || "";
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var ok = true;
      var name = form.elements.fullname;
      var attending = form.querySelector('input[name="attending"]:checked');

      if (!name.value.trim() || name.value.trim().length < 2) {
        setError("fullname", "Please tell us your name.");
        name.closest(".field").classList.add("is-invalid");
        ok = false;
      } else {
        setError("fullname", "");
        name.closest(".field").classList.remove("is-invalid");
      }

      if (!attending) {
        setError("attending", "Please choose an answer.");
        ok = false;
      } else {
        setError("attending", "");
      }

      if (!ok) {
        success.hidden = true;
        return;
      }

      success.textContent =
        attending.value === "yes"
          ? "Thank you, " + name.value.trim() + " — we can't wait to see you."
          : "Thank you for letting us know, " + name.value.trim() + ".";
      success.hidden = false;
      form.reset();
    });

    form.addEventListener("input", function (event) {
      if (event.target.name === "fullname" && event.target.value.trim().length >= 2) {
        setError("fullname", "");
        event.target.closest(".field").classList.remove("is-invalid");
      }
      if (event.target.name === "attending") setError("attending", "");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

