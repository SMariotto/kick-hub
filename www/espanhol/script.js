document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  
  const typingTarget = document.getElementById('typing-target');
  const phrase = 'Me gusta la mañana, me gustas tú';

  function typeWriter(text, el, speed = 65){
    let i = 0;
    el.textContent = '';
    (function step(){
      if(i < text.length){
        el.textContent += text.charAt(i);
        i++;
        setTimeout(step, speed);
      }
    })();
  }

  if(typingTarget){
    if(prefersReducedMotion){
      typingTarget.textContent = phrase;
    } else {
      setTimeout(() => typeWriter(phrase, typingTarget), 600);
    }
  }

  
  const revealEls = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });

  revealEls.forEach(el => revealObserver.observe(el));

  
  const sections = Array.from(document.querySelectorAll('.slide'));
  const dots = Array.from(document.querySelectorAll('.dot'));
  const btnUp = document.getElementById('btn-up');
  const btnDown = document.getElementById('btn-down');

  let currentIndex = 0;

  function setActiveDot(index){
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  }
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        const idx = sections.indexOf(entry.target);
        if(idx !== -1){
          currentIndex = idx;
          setActiveDot(idx);
        }
      }
    });
  }, { threshold: 0.6 });

  sections.forEach(sec => sectionObserver.observe(sec));
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      sections[i]?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });
  function goToSection(index){
    const clamped = Math.max(0, Math.min(sections.length - 1, index));
    sections[clamped].scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }

  btnUp?.addEventListener('click', () => goToSection(currentIndex - 1));
  btnDown?.addEventListener('click', () => goToSection(currentIndex + 1));

  
  const knob = document.getElementById('radio-knob');
  const vuMeter = document.getElementById('vu-meter');
  const radioLight = document.getElementById('radio-light');
  const vinylRecord = document.getElementById('vinyl-record');
  const bgAudio = document.getElementById('bg-audio');

  let knobRotation = 0;
  let isPlaying = false;
  function setPlayingVisuals(playing){
    vuMeter?.classList.toggle('playing', playing);
    radioLight?.classList.toggle('active', playing);
    vinylRecord?.classList.toggle('spinning', playing);
  }

  knob?.addEventListener('click', () => {
    knobRotation += 75;
    knob.style.transform = `rotate(${knobRotation}deg)`;

    isPlaying = !isPlaying;
    setPlayingVisuals(isPlaying);

    if(!bgAudio) return;

    if(isPlaying){
      bgAudio.play().catch(() => {
        isPlaying = false;
        setPlayingVisuals(false);
      });
    } else {
      bgAudio.pause();
    }
  });
  bgAudio?.addEventListener('ended', () => {
    isPlaying = false;
    setPlayingVisuals(false);
  });

  
  const flashcards = document.querySelectorAll('.flashcard');

  flashcards.forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
    });
  });

});
