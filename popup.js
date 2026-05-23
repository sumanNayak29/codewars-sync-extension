// popup.js

const tokenInput = document.getElementById("token");
const ownerInput = document.getElementById("owner");
const repoInput = document.getElementById("repo");
const saveBtn = document.getElementById("saveBtn");
const savedMsg = document.getElementById("savedMsg");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");

// Load saved settings
chrome.storage.sync.get(
  ["cwsync_token", "cwsync_owner", "cwsync_repo"],
  ({ cwsync_token, cwsync_owner, cwsync_repo }) => {
    if (cwsync_token) tokenInput.value = cwsync_token;
    if (cwsync_owner) ownerInput.value = cwsync_owner;
    if (cwsync_repo) repoInput.value = cwsync_repo;

    updateStatus(cwsync_token, cwsync_owner, cwsync_repo);
  }
);

function updateStatus(token, owner, repo) {
  if (token && owner && repo) {
    statusDot.className = "status-dot connected";
    statusText.textContent = `Connected → ${owner}/${repo}`;
  } else {
    statusDot.className = "status-dot error";
    statusText.textContent = "Not configured — fill in settings below";
  }
}

saveBtn.addEventListener("click", async () => {
  const token = tokenInput.value.trim();
  const owner = ownerInput.value.trim();
  const repo = repoInput.value.trim();

  if (!token || !owner || !repo) {
    savedMsg.textContent = "All fields are required.";
    savedMsg.style.color = "#e74c3c";
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving…";

  // Validate token by hitting GitHub API
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (res.status === 401) throw new Error("Invalid token");
    if (res.status === 404) throw new Error(`Repo "${owner}/${repo}" not found`);
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

    // All good — save
    await chrome.storage.sync.set({
      cwsync_token: token,
      cwsync_owner: owner,
      cwsync_repo: repo,
    });

    updateStatus(token, owner, repo);
    savedMsg.textContent = "✅ Settings saved!";
    savedMsg.style.color = "#27ae60";
  } catch (err) {
    savedMsg.textContent = `❌ ${err.message}`;
    savedMsg.style.color = "#e74c3c";
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Settings";
    setTimeout(() => (savedMsg.textContent = ""), 4000);
  }
});
