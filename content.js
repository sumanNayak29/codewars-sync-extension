// content.js

const LANG_EXTENSIONS = {
  javascript: "js", typescript: "ts", python: "py", ruby: "rb",
  java: "java", csharp: "cs", "c#": "cs", cpp: "cpp", "c++": "cpp",
  c: "c", go: "go", rust: "rs", kotlin: "kt", swift: "swift",
  php: "php", scala: "scala", haskell: "hs", elixir: "ex",
  coffeescript: "coffee", dart: "dart", shell: "sh", r: "r",
};

const LANG_COMMENTS = {
  javascript: "//", typescript: "//", java: "//", "c#": "//", csharp: "//",
  "c++": "//", cpp: "//", c: "//", go: "//", rust: "//", kotlin: "//",
  swift: "//", dart: "//", scala: "//", php: "//",
  python: "#", ruby: "#", elixir: "#", coffeescript: "#", r: "#", shell: "#",
  haskell: "--",
};

// ─── Notifications ────────────────────────────────────────────────────────────

function showToast(message, type) {
  const existing = document.getElementById("cw-sync-toast");
  if (existing) existing.remove();

  const bg = type === "error" ? "#c0392b" : "#2c3e50";
  const icon = type === "error" ? "❌" : "⏳";

  const toast = document.createElement("div");
  toast.id = "cw-sync-toast";
  toast.style.cssText = [
    "position:fixed", "bottom:24px", "right:24px", "z-index:99999",
    "padding:12px 18px", "border-radius:8px",
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    "font-size:14px", "font-weight:500", "color:#fff",
    "background:" + bg,
    "box-shadow:0 4px 20px rgba(0,0,0,0.25)",
    "display:flex", "align-items:center", "gap:10px", "max-width:380px",
    "opacity:0", "transition:opacity 0.3s ease",
  ].join(";");

  toast.innerHTML = "<span style='font-size:16px'>" + icon + "</span><span>" + message + "</span>";
  document.body.appendChild(toast);
  requestAnimationFrame(function () { toast.style.opacity = "1"; });

  if (type !== "loading") {
    setTimeout(function () { toast.remove(); }, 5000);
  }
  return toast;
}

function showSuccessBanner(kataName, filePath, repoUrl) {
  const existing = document.getElementById("cw-sync-banner");
  if (existing) existing.remove();

  const banner = document.createElement("div");
  banner.id = "cw-sync-banner";
  banner.style.cssText = [
    "position:fixed", "top:20px", "left:50%",
    "transform:translateX(-50%) translateY(-20px)",
    "z-index:99999", "background:#0d1117",
    "border:1px solid #238636", "border-radius:12px",
    "padding:16px 20px", "min-width:340px", "max-width:480px",
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    "box-shadow:0 8px 32px rgba(0,0,0,0.5)",
    "opacity:0", "transition:opacity 0.35s ease,transform 0.35s ease",
  ].join(";");

  banner.innerHTML = [
    "<div style='display:flex;align-items:center;gap:10px;margin-bottom:10px'>",
    "<span style='font-size:22px'>🥷</span>",
    "<div>",
    "<div style='font-size:14px;font-weight:700;color:#3fb950'>Pushed to GitHub!</div>",
    "<div style='font-size:12px;color:#8b949e;margin-top:1px'>CodewarsSync</div>",
    "</div>",
    "<button id='cw-sync-close' style='margin-left:auto;background:none;border:none;color:#8b949e;font-size:18px;cursor:pointer;padding:0 4px'>×</button>",
    "</div>",
    "<div style='background:#161b22;border-radius:8px;padding:10px 12px;margin-bottom:10px'>",
    "<div style='font-size:12px;color:#8b949e;margin-bottom:4px'>Kata</div>",
    "<div style='font-size:13px;color:#e6edf3;font-weight:600'>" + kataName + "</div>",
    "</div>",
    "<div style='background:#161b22;border-radius:8px;padding:10px 12px;margin-bottom:12px'>",
    "<div style='font-size:12px;color:#8b949e;margin-bottom:4px'>File</div>",
    "<div style='font-size:12px;color:#79c0ff;font-family:monospace'>" + filePath + "</div>",
    "</div>",
    "<a href='" + repoUrl + "' target='_blank' style='display:block;text-align:center;background:#238636;color:#fff;text-decoration:none;padding:8px;border-radius:7px;font-size:13px;font-weight:600'>",
    "View on GitHub →",
    "</a>",
  ].join("");

  document.body.appendChild(banner);

  requestAnimationFrame(function () {
    banner.style.opacity = "1";
    banner.style.transform = "translateX(-50%) translateY(0)";
  });

  document.getElementById("cw-sync-close").onclick = function () {
    banner.style.opacity = "0";
    setTimeout(function () { banner.remove(); }, 300);
  };

  setTimeout(function () {
    if (document.getElementById("cw-sync-banner")) {
      banner.style.opacity = "0";
      setTimeout(function () { banner.remove(); }, 300);
    }
  }, 8000);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCodeFromEditor() {
  const lines = document.querySelectorAll(".CodeMirror-line");
  if (lines.length === 0) return null;
  return Array.from(lines).map(function (l) { return l.innerText; }).join("\n");
}

function detectLanguage() {
  const urlMatch = window.location.pathname.match(/\/train\/([^/?#]+)/);
  if (urlMatch) return urlMatch[1].toLowerCase();
  return "javascript";
}

function getSlugFromURL() {
  const match = window.location.pathname.match(/\/kata\/([^/]+)/);
  return match ? match[1] : null;
}

function isPassedState() {
  // ✅ Confirmed: Codewars adds "has-green-border" class to the CodeMirror
  // editor div when all tests pass. This is in the main document, not an iframe.
  if (document.querySelector(".CodeMirror.has-green-border")) return true;

  return false;
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function getKataDetails(slug) {
  const res = await fetch("https://www.codewars.com/api/v1/code-challenges/" + slug);
  if (!res.ok) throw new Error("Codewars API error: " + res.status);
  return res.json();
}

async function pushToGitHub(opts) {
  const token = opts.token, owner = opts.owner, repo = opts.repo;
  const kata = opts.kata, language = opts.language, code = opts.code;

  const ext = LANG_EXTENSIONS[language] || "js";
  const commentChar = LANG_COMMENTS[language] || "//";
  const rank = (kata.rank && kata.rank.name) || "unranked";
  const safeRank = rank.replace(" ", "-");
  const tags = (kata.tags || []).join(", ");
  const date = new Date().toLocaleDateString("en-IN");

  const header = [
    commentChar + " Kata   : " + kata.name,
    commentChar + " Rank   : " + rank,
    commentChar + " Lang   : " + language,
    commentChar + " Tags   : " + tags,
    commentChar + " URL    : https://www.codewars.com/kata/" + kata.slug,
    commentChar + " Synced : " + date,
    "", "",
  ].join("\n");

  const fullContent = header + code;
  const filePath = language + "/" + safeRank + "/" + kata.slug + "/solution." + ext;
  const encoded = btoa(unescape(encodeURIComponent(fullContent)));

  const baseUrl = "https://api.github.com/repos/" + owner + "/" + repo + "/contents/" + filePath;
  const headers = {
    "Authorization": "Bearer " + token,
    "Content-Type": "application/json",
    "Accept": "application/vnd.github.v3+json",
  };

  let sha;
  try {
    const check = await fetch(baseUrl, { headers: headers });
    if (check.ok) sha = (await check.json()).sha;
  } catch (_) { }

  const body = {
    message: "Add: " + kata.name + " [" + language + "] (" + rank + ")",
    content: encoded,
  };
  if (sha) body.sha = sha;

  const res = await fetch(baseUrl, {
    method: "PUT",
    headers: headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "GitHub API error: " + res.status);
  }

  return filePath;
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

let hasSynced = false;

async function trySyncSolution() {
  if (hasSynced) return;
  if (!isPassedState()) return;
  if (window.location.pathname.indexOf("/train/") === -1) return;

  const slug = getSlugFromURL();
  if (!slug) return;

  hasSynced = true;

  const settings = await chrome.storage.sync.get(["cwsync_token", "cwsync_owner", "cwsync_repo"]);
  const token = settings.cwsync_token;
  const owner = settings.cwsync_owner;
  const repo = settings.cwsync_repo;

  if (!token || !owner || !repo) {
    showToast("CodewarsSync: Configure GitHub settings in the popup first.", "error");
    hasSynced = false;
    return;
  }

  const loading = showToast("CodewarsSync: Syncing to GitHub…", "loading");

  try {
    const code = getCodeFromEditor();
    if (!code || !code.trim()) throw new Error("Could not read code from editor.");

    const language = detectLanguage();
    console.log("[CodewarsSync] Syncing: " + language + " | " + slug);

    const kata = await getKataDetails(slug);
    const filePath = await pushToGitHub({
      token: token, owner: owner, repo: repo,
      kata: kata, language: language, code: code.trim(),
    });

    loading.remove();
    const repoUrl = "https://github.com/" + owner + "/" + repo + "/blob/main/" + filePath;
    showSuccessBanner(kata.name, filePath, repoUrl);
    console.log("[CodewarsSync] ✅ Pushed: " + filePath);
  } catch (err) {
    loading.remove();
    showToast("CodewarsSync: " + err.message, "error");
    console.error("[CodewarsSync] ❌", err);
    hasSynced = false;
  }
}

// ─── Attach listener to SUBMIT button ────────────────────────────────────────
// We watch for SUBMIT click instead of TEST pass — final solution only.

function attachSubmitListener() {
  const submitBtn = document.querySelector("button#run_button[data-type='submit'], a[data-action='submit'], button.submit-btn");

  // Fallback: find any button whose text is "SUBMIT"
  if (!submitBtn) {
    const allBtns = document.querySelectorAll("button, a");
    for (let i = 0; i < allBtns.length; i++) {
      const text = (allBtns[i].innerText || "").trim().toUpperCase();
      if (text === "SUBMIT" && !allBtns[i]._cwSyncAttached) {
        allBtns[i]._cwSyncAttached = true;
        allBtns[i].addEventListener("click", function () {
          console.log("[CodewarsSync] SUBMIT clicked — waiting for pass confirmation...");
          hasSynced = false;
          // Wait for has-green-border to confirm tests passed after submit
          waitForPassAfterSubmit();
        });
        console.log("[CodewarsSync] ✅ Attached to SUBMIT button");
        return true;
      }
    }
    return false;
  }

  if (!submitBtn._cwSyncAttached) {
    submitBtn._cwSyncAttached = true;
    submitBtn.addEventListener("click", function () {
      console.log("[CodewarsSync] SUBMIT clicked — waiting for pass confirmation...");
      hasSynced = false;
      waitForPassAfterSubmit();
    });
    console.log("[CodewarsSync] ✅ Attached to SUBMIT button");
  }
  return true;
}

function waitForPassAfterSubmit() {
  // Poll for has-green-border after submit — confirms all tests passed
  let attempts = 0;
  const maxAttempts = 30; // 15 seconds max

  const interval = setInterval(function () {
    attempts++;
    if (isPassedState()) {
      clearInterval(interval);
      setTimeout(trySyncSolution, 500);
    } else if (attempts >= maxAttempts) {
      clearInterval(interval);
      console.log("[CodewarsSync] Submit did not result in a pass — skipping sync");
    }
  }, 500);
}

// ─── SPA navigation reset + re-attach on navigation ──────────────────────────

let lastPath = location.pathname;
new MutationObserver(function () {
  if (location.pathname !== lastPath) {
    lastPath = location.pathname;
    hasSynced = false;
    console.log("[CodewarsSync] Page changed, reset sync state");
  }
  // Re-attach submit listener whenever DOM changes (SPA re-renders the button)
  attachSubmitListener();
}).observe(document.body, { childList: true, subtree: true });

// Initial attach attempt
attachSubmitListener();

console.log("[CodewarsSync] ✅ Extension loaded on " + location.pathname);