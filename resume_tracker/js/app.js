// "0 to shipped" resume parser — mock build (per resume_tracker/decisions.md).
// The parser is simulated locally: deterministic per file, nothing uploaded.
// To make it real later, replace runAnalysis() with a fetch() to the backend.

const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---------- state ----------
let file = null;

// ---------- config ----------
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const SKILLS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python", "SQL", "MongoDB",
  "Git", "Docker", "AWS", "REST API", "HTML", "CSS", "Jest", "CI/CD",
  "Communication", "Leadership", "Testing", "Agile", "Problem Solving",
];

// ---------- file handling ----------

function showError(msg) {
  const el = $("upload-error");
  el.textContent = msg;
  el.classList.remove("hidden");
}

function clearError() {
  $("upload-error").classList.add("hidden");
}

function setFile(f) {
  clearError();
  if (!f) return;
  if (f.type !== "application/pdf") {
    return showError("That doesn't look like a PDF. Please choose a .pdf file.");
  }
  if (f.size > MAX_BYTES) {
    return showError(`File is too large (${(f.size / 1048576).toFixed(1)} MB). The limit is 2 MB.`);
  }
  file = f;
  $("file-name").textContent = f.name;
  $("file-size").textContent = `${(f.size / 1024).toFixed(0)} KB`;
  $("file-chip").classList.remove("hidden");
  $("dropzone").classList.add("hidden");
  $("analyze-btn").disabled = false;
}

function removeFile() {
  file = null;
  $("file-chip").classList.add("hidden");
  $("dropzone").classList.remove("hidden");
  $("analyze-btn").disabled = true;
  $("file-input").value = "";
}

const dropzone = $("dropzone");
dropzone.addEventListener("click", () => $("file-input").click());
dropzone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("file-input").click(); }
});
dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.classList.add("dragover"); });
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");
  if (e.dataTransfer.files.length) setFile(e.dataTransfer.files[0]);
});
$("file-input").addEventListener("change", (e) => setFile(e.target.files[0]));
$("file-remove").addEventListener("click", removeFile);

// ---------- mock analysis ----------
// Deterministic: the score is a pure function of the file's name and size,
// so the same file always produces the same result.

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function runAnalysis(f) {
  const seed = hashString(f.name + ":" + f.size);
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const present = SKILLS.filter(() => rand() < 0.45);
  const missing = SKILLS.filter((s) => !present.includes(s));
  const score = Math.round((present.length / SKILLS.length) * 100);

  return { score, present, missing };
}

// ---------- progress + render ----------

const STEPS = ["Reading file…", "Extracting text…", "Matching skills…", "Scoring…"];

function showProgress(steps, done) {
  return new Promise((resolve) => {
    let i = 0;
    const tick = () => {
      if (i >= steps.length) return resolve();
      $("progress-fill").style.width = `${((i + 1) / steps.length) * 100}%`;
      $("progress-step").textContent = steps[i];
      i++;
      setTimeout(tick, 350);
    };
    tick();
  });
}

async function analyze() {
  if (!file) return;
  $("analyze-btn").disabled = true;
  $("progress").classList.remove("hidden");
  await showProgress(STEPS);
  const result = runAnalysis(file);
  renderResults(result);
  $("progress").classList.add("hidden");
  $("analyze-btn").disabled = false;
  document.getElementById("results").scrollIntoView({ behavior: "smooth" });
}

function renderResults({ score, present, missing }) {
  $("result-file").textContent = file.name;
  $("score-num").textContent = score;
  $("score-verdict").textContent =
    score >= 80 ? "Shipped 🚀" : score >= 60 ? "Almost there" : "Needs work";
  $("score-bar-fill").style.width = `${score}%`;

  const presentBadges = present.map((s) => `<span class="badge badge-present">${esc(s)}</span>`).join("");
  const missingBadges = missing.map((s) => `<span class="badge badge-missing">${esc(s)}</span>`).join("");
  $("present-badges").innerHTML = presentBadges || '<span class="badges-empty">None detected.</span>';
  $("missing-badges").innerHTML = missingBadges || '<span class="badges-empty">Nothing missing — nice.</span>';
  $("present-count").textContent = `(${present.length})`;
  $("missing-count").textContent = `(${missing.length})`;

  $("results").classList.remove("hidden");
}

$("analyze-btn").addEventListener("click", analyze);

// Sample file for demoing without a PDF at hand.
$("sample-btn").addEventListener("click", () => {
  setFile(new File(["sample"], "sample-resume.pdf", { type: "application/pdf" }));
});
