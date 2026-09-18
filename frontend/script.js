// ---------------------------------------------------------------------------
// NextWord AI — frontend logic
// Talks to the FastAPI backend running locally at API_BASE_URL.
// ---------------------------------------------------------------------------

const API_BASE_URL = "http://127.0.0.1:5000";

// ---- element references ---------------------------------------------------
const predictInput = document.getElementById("predict-input");
const predictBtn = document.getElementById("predict-btn");
const clearBtn = document.getElementById("clear-btn");
const predictHint = document.getElementById("predict-hint");
const resultCard = document.getElementById("result-card");
const resultWord = document.getElementById("result-word");
const predictError = document.getElementById("predict-error");

const generateInput = document.getElementById("generate-input");
const wordCountInput = document.getElementById("word-count");
const incrementBtn = document.getElementById("increment-btn");
const decrementBtn = document.getElementById("decrement-btn");
const generateBtn = document.getElementById("generate-btn");
const generateHint = document.getElementById("generate-hint");
const generateError = document.getElementById("generate-error");
const generatedCard = document.getElementById("generated-card");
const generatedText = document.getElementById("generated-text");
const copyBtn = document.getElementById("copy-btn");
const resetBtn = document.getElementById("reset-btn");

const pipeline = document.getElementById("pipeline");
const pipelineSteps = pipeline ? Array.from(pipeline.querySelectorAll(".pipeline-step")) : [];
const outputGlyph = document.getElementById("output-glyph");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function setButtonLoading(button, isLoading) {
  const label = button.querySelector(".btn-label");
  const spinner = button.querySelector(".btn-spinner");
  button.disabled = isLoading;
  if (spinner) spinner.hidden = !isLoading;
  if (label) label.style.opacity = isLoading ? "0.6" : "1";
}

function showError(el, message) {
  el.textContent = message;
  el.hidden = false;
}

function hideError(el) {
  el.hidden = true;
  el.textContent = "";
}

async function friendlyErrorFromResponse(response) {
  try {
    const data = await response.json();
    if (data && data.detail) return data.detail;
  } catch (_) {
    // response body wasn't JSON — fall through to generic message
  }
  if (response.status >= 500) {
    return "Something went wrong on the model's end. Please try again.";
  }
  return "That request couldn't be processed. Please try a different phrase.";
}

function networkErrorMessage() {
  return "Can't reach the backend. Make sure the FastAPI server is running at " + API_BASE_URL + ".";
}

// ---------------------------------------------------------------------------
// Pipeline "processing" animation — lights up Text → Tokenization →
// Padding → LSTM → Next word in sequence while a request is in flight,
// so the diagram in the About section doubles as a live loading state.
// ---------------------------------------------------------------------------
let pipelineTimer = null;

function startPipelineAnimation() {
  if (!pipelineSteps.length) return;
  pipeline.classList.add("is-processing");
  let i = 0;
  pipelineSteps.forEach((s) => s.classList.remove("active"));
  pipelineTimer = setInterval(() => {
    pipelineSteps.forEach((s) => s.classList.remove("active"));
    pipelineSteps[i % pipelineSteps.length].classList.add("active");
    i++;
  }, 320);
}

function stopPipelineAnimation(success) {
  if (!pipelineSteps.length) return;
  clearInterval(pipelineTimer);
  pipelineTimer = null;
  pipelineSteps.forEach((s) => s.classList.remove("active"));
  pipeline.classList.remove("is-processing");
  if (success) {
    const last = pipelineSteps[pipelineSteps.length - 1];
    last.classList.add("active");
    setTimeout(() => last.classList.remove("active"), 900);
  }
}

// Briefly reflect a successful prediction in the hero diagram's output node.
function flashOutputGlyph(word) {
  if (!outputGlyph || !word) return;
  const original = outputGlyph.textContent;
  outputGlyph.textContent = word.charAt(0).toUpperCase();
  setTimeout(() => {
    outputGlyph.textContent = original === "?" ? "?" : original;
  }, 1800);
}

// ---------------------------------------------------------------------------
// Typewriter reveal for the predicted word
// ---------------------------------------------------------------------------
function typeWriter(el, text, speed = 45) {
  el.textContent = "";
  let i = 0;
  return new Promise((resolve) => {
    (function step() {
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
        setTimeout(step, speed);
      } else {
        resolve();
      }
    })();
  });
}

// ---------------------------------------------------------------------------
// Predict next word
// ---------------------------------------------------------------------------
predictInput.addEventListener("input", () => {
  resultCard.hidden = true;
  hideError(predictError);
  predictHint.textContent = predictInput.value.trim()
    ? "Press \u2018Predict next word\u2019 to see a suggestion."
    : "\u00A0";
});

async function predictNextWord() {
  const text = predictInput.value.trim();

  hideError(predictError);
  resultCard.hidden = true;

  if (!text) {
    showError(predictError, "Type a starting phrase first.");
    return;
  }

  setButtonLoading(predictBtn, true);
  predictHint.textContent = "Generating prediction...";
  startPipelineAnimation();

  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      stopPipelineAnimation(false);
      showError(predictError, await friendlyErrorFromResponse(response));
      predictHint.textContent = "\u00A0";
      return;
    }

    const data = await response.json();
    stopPipelineAnimation(true);
    resultCard.hidden = false;
    await typeWriter(resultWord, data.predicted_word);
    flashOutputGlyph(data.predicted_word);
    predictHint.textContent = "\u00A0";
  } catch (err) {
    stopPipelineAnimation(false);
    showError(predictError, networkErrorMessage());
    predictHint.textContent = "\u00A0";
  } finally {
    setButtonLoading(predictBtn, false);
  }
}

predictBtn.addEventListener("click", predictNextWord);

clearBtn.addEventListener("click", () => {
  predictInput.value = "";
  resultCard.hidden = true;
  hideError(predictError);
  predictHint.textContent = "\u00A0";
  predictInput.focus();
});

// ---------------------------------------------------------------------------
// Word-count stepper
// ---------------------------------------------------------------------------
function clampWordCount() {
  let value = parseInt(wordCountInput.value, 10);
  if (Number.isNaN(value)) value = 10;
  value = Math.min(50, Math.max(1, value));
  wordCountInput.value = value;
  return value;
}

incrementBtn.addEventListener("click", () => {
  const next = clampWordCount() + 1;
  wordCountInput.value = next > 50 ? 50 : next;
});

decrementBtn.addEventListener("click", () => {
  const next = clampWordCount() - 1;
  wordCountInput.value = next < 1 ? 1 : next;
});

wordCountInput.addEventListener("change", clampWordCount);

// ---------------------------------------------------------------------------
// Generate passage
// ---------------------------------------------------------------------------
function renderGeneratedText(seedText, words) {
  generatedText.innerHTML = "";

  // add the starting text
  const seedSpan = document.createElement("span");
  seedSpan.className = "seed-text";
  seedSpan.textContent = seedText;
  generatedText.appendChild(seedSpan);

  // add each generated word with a space before it
  words.forEach((word, index) => {
    const wordSpan = document.createElement("span");
    wordSpan.className = "gen-word";
    wordSpan.style.animationDelay = `${index * 70}ms`;

    wordSpan.textContent = " " + word;

    generatedText.appendChild(wordSpan);
  });
}

async function generateText() {
  const text = generateInput.value.trim();
  const numWords = clampWordCount();

  hideError(generateError);
  generatedCard.hidden = true;
  generateHint.textContent = " ";

  if (!text) {
    showError(generateError, "Type a starting phrase first.");
    return;
  }

  setButtonLoading(generateBtn, true);
  generateHint.textContent = "Generating passage...";
  startPipelineAnimation();

  try {
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, num_words: numWords }),
    });

    if (!response.ok) {
      stopPipelineAnimation(false);
      showError(generateError, await friendlyErrorFromResponse(response));
      generateHint.textContent = " ";
      return;
    }

    const data = await response.json();

    stopPipelineAnimation(true);

    renderGeneratedText(data.input_text, data.words_added);
    generatedCard.hidden = false;

    // hide the processing message after the result appears
    generateHint.textContent = " ";

    if (data.words_added && data.words_added.length) {
      flashOutputGlyph(data.words_added[data.words_added.length - 1]);
    }

  } catch (err) {
    stopPipelineAnimation(false);
    showError(generateError, networkErrorMessage());
    generateHint.textContent = " ";
  } finally {
    setButtonLoading(generateBtn, false);
  }
}

generateBtn.addEventListener("click", generateText);

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(generatedText.textContent);
    const original = copyBtn.textContent;
    copyBtn.textContent = "Copied";
    setTimeout(() => (copyBtn.textContent = original), 1400);
  } catch (_) {
    showError(generateError, "Couldn't copy to clipboard — please copy the text manually.");
  }
});

resetBtn.addEventListener("click", () => {
  generateInput.value = "";
  wordCountInput.value = 10;
  generatedCard.hidden = true;
  hideError(generateError);
  generateInput.focus();
});

// ---------------------------------------------------------------------------
// Enter-to-submit convenience
// ---------------------------------------------------------------------------
predictInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    predictNextWord();
  }
});

generateInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    generateText();
  }
});
