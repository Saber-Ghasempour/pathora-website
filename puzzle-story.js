(() => {
  const motion = matchMedia('(min-width: 761px) and (prefers-reduced-motion: no-preference)');
  if (!('IntersectionObserver' in window)) return;

  const clamp = value => Math.min(1, Math.max(0, value));

  function scrollProgress(story, stage) {
    const top = parseFloat(getComputedStyle(stage).top);
    const travel = story.offsetHeight - stage.offsetHeight;
    return clamp((top - story.getBoundingClientRect().top) / Math.max(1, travel));
  }

  function scrubVideo(video, progress) {
    const time = progress * Math.max(0, video.duration - 1 / 30);
    if (Math.abs(video.currentTime - time) >= 1 / 30) video.currentTime = time;
  }

  function watchScroll(story, render, syncMode) {
    let frame;
    let nearby = false;

    function schedule() {
      if (frame !== undefined || !nearby || !motion.matches) return;
      frame = requestAnimationFrame(() => {
        frame = undefined;
        if (nearby && motion.matches) render();
      });
    }

    function update() {
      syncMode(nearby && motion.matches);
      schedule();
    }

    const observer = new IntersectionObserver(([entry]) => {
      nearby = entry.isIntersecting;
      update();
    }, { rootMargin: '350px 0px' });

    motion.addEventListener('change', update);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    observer.observe(story);
    return schedule;
  }

  function connectPuzzle(story) {
    const stage = story.querySelector('.story-stage');
    const video = stage.querySelector('video');
    if (!video.canPlayType('video/mp4')) return;

    let ready = false;
    let failed = false;
    const schedule = watchScroll(story, () => {
      if (!ready || failed) return;
      const progress = scrollProgress(story, stage);
      scrubVideo(video, progress);
      stage.style.setProperty('--progress', progress);
    }, active => {
      story.classList.toggle('is-scrubbed', motion.matches && ready && !failed);
      if (active && !failed && !video.hasAttribute('src')) {
        video.preload = 'auto';
        video.src = video.dataset.videoSrc;
      }
    });

    // Keep the stills visible until the browser has decoded the first frame.
    video.addEventListener('loadeddata', () => {
      ready = true;
      story.classList.toggle('is-scrubbed', motion.matches);
      schedule();
    });
    video.addEventListener('error', () => {
      failed = true;
      story.classList.remove('is-scrubbed');
    });
  }

  document.querySelectorAll('[data-scroll-story]').forEach(connectPuzzle);
})();
