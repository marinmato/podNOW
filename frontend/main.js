const topicInput = document.getElementById("topicInput");
const statusDiv  = document.getElementById("status");
const player     = document.getElementById("player");
const genBtn     = document.getElementById("generateBtn");

document.querySelectorAll(".preset").forEach(btn =>
  btn.addEventListener("click", () => { topicInput.value = btn.textContent; })
);

genBtn.addEventListener("click", async () => {
  const topic = topicInput.value.trim();
  if (!topic) return alert("Enter a topic or click a preset!");

  statusDiv.innerHTML = '<span class="loading"></span>Generating… this may take 30‑40 s';
  genBtn.disabled = true;
  player.style.display = "none";

  try {
    const res = await fetch("/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic })
    });
    const { audioUrl, error } = await res.json();
    if (error) throw new Error(error);
    player.src = audioUrl;
    player.style.display = "block";
    statusDiv.textContent = "Podcast ready — press play!";
  } catch (e) {
    statusDiv.textContent = "Error: " + e.message;
  } finally {
    genBtn.disabled = false;
  }
});