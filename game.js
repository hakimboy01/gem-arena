const symbols = ['🪙', '💎', '🧧', '🪭', '🍀', '🐾', '🌕', '🧨'];

const reels = document.getElementById('reels');
const spinBtn = document.getElementById('spin');

let balance = 250000;
let bet = 10000;
let spinning = false;
let lastWin = 0;

let spinSpeed = 1;
let autoMode = false;
let autoTimer = null;

let musicOn = true;
let sfxOn = true;
let masterVolume = 0.55;

let audioCtx = null;
let musicTimer = null;

const fmt = n =>
  new Intl.NumberFormat('id-ID').format(Math.floor(n));

/* =========================
   SAVE / LOAD
========================= */

function save() {
  localStorage.setItem(
    'jcr',
    JSON.stringify({
      balance,
      bet,
      musicOn,
      sfxOn,
      masterVolume,
      spinSpeed
    })
  );
}

function load() {
  try {
    const d = JSON.parse(localStorage.getItem('jcr'));

    if (!d) return;

    balance = d.balance ?? balance;
    bet = d.bet ?? bet;

    musicOn = d.musicOn ?? musicOn;
    sfxOn = d.sfxOn ?? sfxOn;
    masterVolume = d.masterVolume ?? masterVolume;
    spinSpeed = d.spinSpeed ?? spinSpeed;

  } catch (e) {
    console.log('Load error', e);
  }
}

/* =========================
   RENDER
========================= */

function render() {
  document.getElementById('coins').textContent = fmt(balance);
  document.getElementById('bet').textContent = fmt(bet);
  document.getElementById('win').textContent = fmt(lastWin);

  const speedBtn = document.getElementById('speed');

  if (speedBtn) {
    speedBtn.innerHTML =
      spinSpeed === 1
        ? '⚡ 1×<br>CEPAT'
        : '⚡ 2×<br>SUPER';
  }

  const soundBtn = document.getElementById('sound');

  if (soundBtn) {
    soundBtn.textContent =
      sfxOn ? '🔊 Suara' : '🔇 Senyap';
  }
}

/* =========================
   CREATE BOARD
========================= */

function randomSymbol() {
  return symbols[
    Math.floor(Math.random() * symbols.length)
  ];
}

function makeGrid() {

  reels.innerHTML = '';

  for (let col = 0; col < 5; col++) {

    const reel = document.createElement('div');

    reel.className = 'reel';

    for (let row = 0; row < 3; row++) {

      const cell = document.createElement('div');

      cell.className = 'symbol';

      cell.dataset.c = col;
      cell.dataset.r = row;

      cell.textContent = randomSymbol();

      reel.appendChild(cell);
    }

    reels.appendChild(reel);
  }
}

/* =========================
   AUDIO
========================= */

function getAudio() {

  try {

    if (!audioCtx) {

      const Audio =
        window.AudioContext ||
        window.webkitAudioContext;

      if (Audio) {
        audioCtx = new Audio();
      }
    }

    if (
      audioCtx &&
      audioCtx.state === 'suspended'
    ) {
      audioCtx.resume().catch(() => {});
    }

    return audioCtx;

  } catch (e) {

    return null;
  }
}

function beep(
  frequency = 440,
  duration = 0.08,
  type = 'sine',
  volume = 0.08
) {

  if (!sfxOn) return;

  const ctx = getAudio();

  if (!ctx) return;

  try {

    const oscillator =
      ctx.createOscillator();

    const gain =
      ctx.createGain();

    oscillator.type = type;

    oscillator.frequency.setValueAtTime(
      frequency,
      ctx.currentTime
    );

    gain.gain.setValueAtTime(
      Math.max(
        0.001,
        volume * masterVolume
      ),
      ctx.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();

    oscillator.stop(
      ctx.currentTime + duration + 0.03
    );

  } catch (e) {}
}

/* =========================
   SOUND EFFECTS
========================= */

function sfx(name) {

  if (!sfxOn) return;

  if (name === 'spin') {

    beep(220, 0.05, 'triangle', 0.06);

    setTimeout(() => {
      beep(300, 0.05, 'triangle', 0.05);
    }, 45);

  }

  if (name === 'stop') {

    beep(420, 0.07, 'sine', 0.08);

  }

  if (name === 'win') {

    beep(660, 0.10, 'triangle', 0.10);

    setTimeout(() => {
      beep(880, 0.16, 'triangle', 0.10);
    }, 110);

  }

  if (name === 'jackpot') {

    [523, 659, 784, 1046]
      .forEach((note, i) => {

        setTimeout(() => {
          beep(
            note,
            0.16,
            'triangle',
            0.12
          );
        }, i * 120);

      });

  }

  if (name === 'click') {

    beep(520, 0.05, 'triangle', 0.05);

  }

}

/* =========================
   MUSIC
========================= */

function musicNote(
  frequency,
  duration = 0.18
) {

  if (!musicOn) return;

  const ctx = getAudio();

  if (!ctx) return;

  try {

    const oscillator =
      ctx.createOscillator();

    const gain =
      ctx.createGain();

    oscillator.type = 'sine';

    oscillator.frequency.value =
      frequency;

    gain.gain.setValueAtTime(
      0.018 * masterVolume,
      ctx.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();

    oscillator.stop(
      ctx.currentTime + duration
    );

  } catch (e) {}
}

function startMusic() {

  if (!musicOn) return;

  if (musicTimer) return;

  const notes = [
    220,
    277,
    330,
    277,
    247,
    294,
    370,
    294
  ];

  let index = 0;

  function loop() {

    if (!musicOn) {

      musicTimer = null;

      return;
    }

    musicNote(
      notes[index % notes.length]
    );

    index++;

    musicTimer =
      setTimeout(loop, 850);
  }

  loop();
}

function stopMusic() {

  if (musicTimer) {

    clearTimeout(musicTimer);

    musicTimer = null;
  }
}

function unlockSound() {

  getAudio();

  if (musicOn) {
    startMusic();
  }
}

/* =========================
   MODAL
========================= */

function modal(title, html) {

  document.getElementById(
    'modalTitle'
  ).textContent = title;

  document.getElementById(
    'modalBody'
  ).innerHTML = html;

  document.getElementById(
    'modal'
  ).classList.remove('hidden');
}

function closeModal() {

  document.getElementById(
    'modal'
  ).classList.add('hidden');
}

document.getElementById(
  'close'
).onclick = closeModal;

/* =========================
   SPIN
========================= */

function spin() {

  if (spinning) return;

  if (balance < bet) {

    stopAuto();

    showOutOfCoins();

    return;
  }

  unlockSound();

  spinning = true;

  spinBtn.disabled = true;

  balance -= bet;

  lastWin = 0;

  render();

  const reelsArr =
    [...document.querySelectorAll('.reel')];

  /*
    SPEED 1 = lebih santai
    SPEED 2 = lebih cepat
  */

  const interval =
    spinSpeed === 1
      ? 115
      : 55;

  const rounds =
    spinSpeed === 1
      ? 13
      : 8;

  reelsArr.forEach(
    (reel, col) => {

      reel.classList.add('spinning');

      let ticks = 0;

      const cells =
        [...reel.querySelectorAll('.symbol')];

      const stopAfter =
        rounds + col * 3;

      const timer =
        setInterval(() => {

          /*
            Simbol berubah
            memberi kesan reel bergerak
          */

          cells.forEach(cell => {

            cell.textContent =
              randomSymbol();

          });

          if (
            ticks % 4 === 0
          ) {
            sfx('spin');
          }

          ticks++;

          if (
            ticks >= stopAfter
          ) {

            clearInterval(timer);

            reel.classList.remove(
              'spinning'
            );

            reel.classList.add(
              'stopped'
            );

            sfx('stop');

            setTimeout(() => {

              reel.classList.remove(
                'stopped'
              );

            }, 220);

            /*
              Reel terakhir selesai
            */

            if (
              col === reelsArr.length - 1
            ) {

              setTimeout(() => {

                finish();

              }, 250);
            }
          }

        }, interval);

    }
  );
}

/* =========================
   CHECK WIN
========================= */

function finish() {

  const cells =
    [...document.querySelectorAll('.symbol')];

  const rows =
    [0, 1, 2].map(row => {

      return cells
        .filter(cell =>
          Number(cell.dataset.r) === row
        )
        .map(cell => cell.textContent);

    });

  let best = 0;

  let winning = [];

  rows.forEach(
    (row, rowIndex) => {

      const counts = {};

      row.forEach(symbol => {

        counts[symbol] =
          (counts[symbol] || 0) + 1;

      });

      const max =
        Math.max(
          ...Object.values(counts)
        );

      if (max >= 3) {

        const symbol =
          Object.keys(counts)
            .find(
              key =>
                counts[key] === max
            );

        let multiplier = 2;

        if (max === 4) {
          multiplier = 5;
        }

        if (max === 5) {
          multiplier = 12;
        }

        const win =
          bet * multiplier;

        if (win > best) {

          best = win;

          winning =
            cells.filter(cell =>
              Number(cell.dataset.r) ===
                rowIndex &&
              cell.textContent === symbol
            );
        }
      }

    }
  );

  /*
    JACKPOT
  */

  const jackpot =
    Math.random() < 0.018;

  if (jackpot) {

    stopAuto();

    sfx('jackpot');

    best = bet * 30;

    winning =
      cells
        .filter(
          (_, i) => i % 4 === 0
        )
        .slice(0, 5);

    modal(
      '🐯 JACKPOT!',
      `
      <div class="jackpot">
        JUNGLE JACKPOT!
      </div>

      <p>
        Kamu memenangkan
        <b>${fmt(best)} COIN</b>
      </p>

      <button id="claim">
        🎁 CLAIM HADIAH
      </button>

      <p>
        <small>
          Hadiah berupa coin virtual dalam game.
        </small>
      </p>
      `
    );

    setTimeout(() => {
