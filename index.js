const nSamples = 8;

async function getSound(recognizer, word, count) {
  for (let i = 0; i < count; i += 1) {
    console.log('%c Say ', 'background: #ffcc99; color: black', word);
    await recognizer.collectExample(word);
  }
}

async function go() {
  const word = document.querySelector('#word');
  const wordToLearn = word.value.toString();

  const baseRecognizer = speechCommands.create('BROWSER_FFT');

  console.log('Model Loading...');
  await baseRecognizer.ensureModelLoaded();

  console.log('Building transfer recognizer...');
  const transferRecognizer = baseRecognizer.createTransfer('colors');

  if (wordToLearn.length > 3) {
    await getSound(transferRecognizer, wordToLearn, nSamples);
  }

  await getSound(transferRecognizer, 'Beautiful Day', nSamples);
  await getSound(transferRecognizer, '_background_noise_', nSamples);
  console.log('%c Finished ', 'background: #ccff99; color: black');
  console.table(transferRecognizer.countExamples());

  console.log('%c Training... ', 'background: #ffcccc; color: black');
  await transferRecognizer.train({
    epochs: 25,
    callback: {
      onEpochEnd: async (epoch, logs) => {
        console.log(`Epoch ${epoch}: loss=${logs.loss}, accuracy=${logs.acc}`);
      },
    },
  });

  console.log('%c Listening... ', 'background: #66ffff; color: black');
  await transferRecognizer.listen(
    result => {
      console.log('%c ', 'background: #66ffff; color: black');
      const words = transferRecognizer.wordLabels();

      scores = Array.from(result.scores).map((s, i) => ({
        score: s,
        word: words[i],
      }));

      scores.sort((s1, s2) => s2.score - s1.score);

      console.log(`Score for word '${scores[0].word}' = ${scores[0].score}`);
    },
    { probabilityThreshold: 0.75 }
  );
  setTimeout(() => {
    transferRecognizer.stopListening();
  }, 20e3);
}

const start = document.querySelector('#go');

start.addEventListener('click', go);

document.addEventListener('keyup', e => (e.key === 'Enter' ? go() : null));
