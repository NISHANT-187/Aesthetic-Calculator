const result = document.querySelector("#result");
const history = document.querySelector("#history");
const soundToggle = document.querySelector("#soundToggle");
const keys = document.querySelectorAll(".key");

let expression = "";
let lastAnswer = "";
let soundEnabled = true;
let audioContext;

const operators = ["+", "-", "*", "/", "%"];

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  return audioContext;
}

function playClick() {
  if (!soundEnabled) return;

  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(560, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.06);

  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.13, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.08);
}

function formatExpression(value) {
  return value
    .replaceAll("*", "×")
    .replaceAll("/", "÷")
    .replaceAll("-", "−");
}

function updateDisplay(animate = true) {
  result.textContent = expression ? formatExpression(expression) : "0";
  history.textContent = lastAnswer;

  if (!animate) return;

  result.classList.remove("pop");
  requestAnimationFrame(() => {
    result.classList.add("pop");
    setTimeout(() => result.classList.remove("pop"), 170);
  });
}

function appendValue(value) {
  const last = expression.at(-1);

  if (value === "." && currentNumber().includes(".")) return;
  if (operators.includes(value) && operators.includes(last)) {
    expression = expression.slice(0, -1) + value;
    updateDisplay();
    return;
  }

  if (expression === "0" && value !== ".") {
    expression = value;
  } else {
    expression += value;
  }

  updateDisplay();
}

function currentNumber() {
  return expression.split(/[+\-*/%]/).at(-1) || "";
}

function clearCalculator() {
  expression = "";
  lastAnswer = "";
  updateDisplay();
}

function deleteLast() {
  expression = expression.slice(0, -1);
  updateDisplay();
}

function calculate() {
  if (!expression || operators.includes(expression.at(-1))) return;

  try {
    const sanitized = expression.replace(/%/g, "/100");
    const answer = Function(`"use strict"; return (${sanitized})`)();

    if (!Number.isFinite(answer)) {
      throw new Error("Invalid result");
    }

    lastAnswer = `${formatExpression(expression)} =`;
    expression = Number.isInteger(answer)
      ? String(answer)
      : String(Number(answer.toFixed(8)));
    updateDisplay();
  } catch {
    lastAnswer = "";
    expression = "";
    result.textContent = "Error";
    history.textContent = "Try another calculation";
    result.classList.add("pop");
    setTimeout(() => result.classList.remove("pop"), 240);
  }
}

function handleAction(button) {
  playClick();

  const action = button.dataset.action;
  const value = button.dataset.value;

  if (action === "clear") clearCalculator();
  if (action === "delete") deleteLast();
  if (action === "calculate") calculate();
  if (value) appendValue(value);
}

keys.forEach((key) => {
  key.addEventListener("pointermove", (event) => {
    const rect = key.getBoundingClientRect();
    key.style.setProperty("--x", `${event.clientX - rect.left}px`);
    key.style.setProperty("--y", `${event.clientY - rect.top}px`);
  });

  key.addEventListener("click", () => handleAction(key));
});

soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggle.classList.toggle("is-on", soundEnabled);
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  if (soundEnabled) playClick();
});

window.addEventListener("keydown", (event) => {
  const keyMap = {
    Enter: "calculate",
    "=": "calculate",
    Backspace: "delete",
    Escape: "clear",
  };

  const action = keyMap[event.key];
  const value = /^[0-9+\-*/%.]$/.test(event.key) ? event.key : "";

  if (!action && !value) return;
  event.preventDefault();

  const button = action
    ? document.querySelector(`[data-action="${action}"]`)
    : document.querySelector(`[data-value="${CSS.escape(value)}"]`);

  if (button) {
    button.classList.add("is-pressed");
    setTimeout(() => button.classList.remove("is-pressed"), 130);
    handleAction(button);
  }
});

updateDisplay(false);
