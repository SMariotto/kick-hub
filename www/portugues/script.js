document.addEventListener('DOMContentLoaded', () => {

  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });
  revealEls.forEach(el => revealObserver.observe(el));

  const questions = [
    { q: 'Qual o apelido de Gregório de Matos?', a: 'Boca do Inferno' },
    { q: 'Em qual período literário ele se insere?', a: 'Barroco' },
    { q: 'O que é o Cultismo?', a: 'Jogo de palavras e linguagem rebuscada.' },
    { q: 'O que é o Conceptismo?', a: 'Jogo de ideias e uso da lógica.' },
    { q: 'Qual o grande contraste do Barroco?', a: 'O conflito entre o pecado (prazer) e o perdão (religião).' }
  ];

  const modal = document.getElementById('quiz-modal');
  const btnOpenQuiz = document.getElementById('btn-quiz');
  const btnCloseQuiz = document.getElementById('btn-close-quiz');
  const btnReveal = document.getElementById('btn-reveal');
  const btnNext = document.getElementById('btn-next');
  const btnRestart = document.getElementById('btn-restart');

  const questionEl = document.getElementById('quiz-question');
  const answerEl = document.getElementById('quiz-answer');
  const answerWrap = document.getElementById('quiz-answer-wrap');
  const progressFill = document.getElementById('progress-fill');
  const progressLabel = document.getElementById('progress-label');
  const quizStage = document.getElementById('quiz-stage');
  const quizEnd = document.getElementById('quiz-end');
  const quizControls = document.querySelector('.quiz-controls');

  let currentQ = 0;
  let revealed = false;

  function loadQuestion(index) {
    revealed = false;
    answerWrap.hidden = true;
    btnNext.disabled = true;
    btnReveal.disabled = false;

    const data = questions[index];
    questionEl.textContent = data.q;
    answerEl.textContent = data.a;

    const pct = ((index + 1) / questions.length) * 100;
    progressFill.style.width = `${pct}%`;
    progressLabel.textContent = `Pergunta ${index + 1} de ${questions.length}`;
  }

  function showEnd() {
    quizStage.hidden = true;
    quizControls.hidden = true;
    quizEnd.hidden = false;
  }

  function restartQuiz() {
    currentQ = 0;
    quizStage.hidden = false;
    quizControls.hidden = false;
    quizEnd.hidden = true;
    loadQuestion(0);
  }

  btnOpenQuiz?.addEventListener('click', () => {
    restartQuiz();
    modal.showModal();
  });

  btnCloseQuiz?.addEventListener('click', () => modal.close());

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.close();
  });

  btnReveal?.addEventListener('click', () => {
    if (revealed) return;
    revealed = true;
    answerWrap.hidden = false;
    btnNext.disabled = false;
    btnReveal.disabled = true;
  });

  btnNext?.addEventListener('click', () => {
    currentQ++;
    if (currentQ >= questions.length) {
      showEnd();
    } else {
      loadQuestion(currentQ);
    }
  });

  btnRestart?.addEventListener('click', restartQuiz);

});
