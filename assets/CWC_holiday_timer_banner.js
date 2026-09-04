/* ==============================================================
   CWC Holiday Timer Banner

   The deadline is an absolute timestamp rendered by Liquid from the
   shop clock (data-deadline, epoch seconds). This file only counts
   down toward it. There is deliberately no localStorage and no
   randomisation: the countdown must not be derived from, or persist
   against, an individual visitor.
   ============================================================== */
(function () {
  'use strict';

  var TICK_MS = 1000;
  var intervals = {};

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function resolveDeadline(deadline, rollover, nowSec) {
    // Daily mode: advance to the next occurrence rather than expiring.
    if (rollover > 0 && deadline <= nowSec) {
      var missed = Math.floor((nowSec - deadline) / rollover) + 1;
      deadline += missed * rollover;
    }
    return deadline;
  }

  function initTimer(timerEl) {
    if (!timerEl || timerEl.dataset.cwcTimerReady === 'true') return;

    var deadline = parseInt(timerEl.dataset.deadline, 10);
    var rollover = parseInt(timerEl.dataset.rollover, 10) || 0;
    var behavior = timerEl.dataset.expiredBehavior || 'hide';
    if (!deadline || isNaN(deadline)) return;

    var hoursEl = timerEl.querySelector('.cwc-holiday-timer-banner__time-unit--hours');
    var minutesEl = timerEl.querySelector('.cwc-holiday-timer-banner__time-unit--minutes');
    var secondsEl = timerEl.querySelector('.cwc-holiday-timer-banner__time-unit--seconds');
    if (!hoursEl || !minutesEl || !secondsEl) return;

    var id = timerEl.id;
    timerEl.dataset.cwcTimerReady = 'true';

    function expire() {
      stop(id);
      var section = timerEl.closest('.cwc-holiday-timer-banner');
      if (behavior === 'hide' && section) {
        section.hidden = true;
        return;
      }
      // Keep the digit structure intact; the labels stay meaningful at zero.
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      timerEl.classList.add('cwc-holiday-timer-banner__timer--expired');
    }

    function update() {
      var nowSec = Math.floor(Date.now() / 1000);
      deadline = resolveDeadline(deadline, rollover, nowSec);

      var remaining = deadline - nowSec;
      if (remaining <= 0) {
        if (rollover > 0) return; // resolveDeadline handles the next tick
        expire();
        return;
      }

      hoursEl.textContent = pad(Math.floor(remaining / 3600));
      minutesEl.textContent = pad(Math.floor((remaining % 3600) / 60));
      secondsEl.textContent = pad(remaining % 60);
    }

    update();
    intervals[id] = setInterval(update, TICK_MS);
  }

  function stop(id) {
    if (intervals[id]) {
      clearInterval(intervals[id]);
      delete intervals[id];
    }
  }

  function initAll(root) {
    (root || document)
      .querySelectorAll('.cwc-holiday-timer-banner__timer[data-deadline]')
      .forEach(initTimer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initAll(); });
  } else {
    initAll();
  }

  // Theme Editor: one listener for the document, not one per section render.
  document.addEventListener('shopify:section:load', function (event) {
    stop('timer-' + event.detail.sectionId);
    initAll(event.target);
  });

  document.addEventListener('shopify:section:unload', function (event) {
    stop('timer-' + event.detail.sectionId);
  });
})();
