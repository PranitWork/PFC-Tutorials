const MANAGER_PASSWORD_HASH =
  "f8e11b659dbc47a45acc79e396ac6e4020728e5439fd53c54d934af3e7aa2da1";

let managerUnlocked = sessionStorage.getItem("mgr_unlocked") === "1";

const root = document.getElementById("tutorial-root");
const searchInput = document.getElementById("searchInput");
const roleFilter = document.getElementById("roleFilter");

const passwordModal = document.getElementById("passwordModal");
const passwordInput = document.getElementById("managerPasswordInput");
const passwordError = document.getElementById("passwordError");
const passwordCancel = document.getElementById("passwordCancel");
const passwordSubmit = document.getElementById("passwordSubmit");

/* 🔐 SHA256 */
async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/* 🎥 Video Embed */
function getVideoEmbed(url) {
  if (!url) return "";

  if (url.includes("youtube") || url.includes("youtu.be")) {
    const id = url.includes("youtu.be")
      ? url.split("youtu.be/")[1].split(/[?&]/)[0]
      : new URL(url).searchParams.get("v");

    return `<iframe src="https://www.youtube.com/embed/${id}" allowfullscreen></iframe>`;
  }

  if (url.includes("drive.google.com")) {
    const match = url.match(/\/d\/([^/]+)/);
    if (match) {
      return `<iframe src="https://drive.google.com/file/d/${match[1]}/preview"></iframe>`;
    }
  }

  if (url.match(/\.(mp4|webm|ogg)$/)) {
    return `
      <video controls preload="metadata">
        <source src="${url}">
      </video>
    `;
  }

  return `<a href="${url}" target="_blank">Open Video</a>`;
}

/* 🧠 Quiz */
function renderQuiz(quiz, key) {
  if (!quiz) return "";
  return `
    <div class="quiz">
      <h5>Quick Quiz</h5>
      ${quiz.map((q, i) => `
        <div class="quiz-question">
          <p>${q.question}</p>
          ${q.options.map((o, oi) => `
            <label>
              <input type="radio" name="${key}-${i}" value="${oi}">
              ${o}
            </label>
          `).join("")}
        </div>
      `).join("")}
      <button class="quiz-submit" onclick="checkQuiz('${key}')">Submit Quiz</button>
      <p class="quiz-result" id="result-${key}"></p>
    </div>
  `;
}

window.checkQuiz = function (key) {
  let score = 0, total = 0;

  TUTORIAL_CONTENT.forEach(section =>
    section.topics.forEach(topic =>
      topic.videos.forEach(video =>
        video.quiz?.forEach((q, i) => {
          const ans = document.querySelector(`input[name="${key}-${i}"]:checked`);
          if (ans) {
            total++;
            if (+ans.value === q.correctIndex) score++;
          }
        })
      )
    )
  );

  document.getElementById(`result-${key}`).textContent =
    `Score: ${score}/${total}`;
};

/* 🔄 MAIN RENDER */
function render() {
  root.innerHTML = "";

  const query = searchInput.value.toLowerCase().trim();
  const selectedRole = roleFilter.value;

  TUTORIAL_CONTENT.forEach(section => {

    if (section.role === "manager" && !managerUnlocked) return;
    if (selectedRole !== "all" && selectedRole !== section.role) return;

    const filteredTopics = section.topics
      .map(topic => {
        const filteredVideos = topic.videos.filter(video =>
          section.roleLabel.toLowerCase().includes(query) ||
          topic.title.toLowerCase().includes(query) ||
          video.title.toLowerCase().includes(query) ||
          video.description.toLowerCase().includes(query)
        );
        return filteredVideos.length ? { ...topic, videos: filteredVideos } : null;
      })
      .filter(Boolean);

    if (!filteredTopics.length) return;

    const roleSection = document.createElement("div");
    roleSection.className = "role-section";
    roleSection.innerHTML = `<h2 class="role-title">${section.roleLabel}</h2>`;

    filteredTopics.forEach(topic => {
      const topicEl = document.createElement("div");
      topicEl.className = "topic";

      topicEl.innerHTML = `
        <div class="topic-header">
          <span>${topic.title}</span>
          <span class="topic-toggle">+</span>
        </div>
        <div class="topic-body">
          ${topic.videos.map(video => `
            <div class="video">
              <h4>${video.title}</h4>
              <p>${video.description}</p>
              <div class="video-frame">
                ${getVideoEmbed(video.url)}
              </div>
              ${renderQuiz(
                video.quiz,
                `${section.role}-${topic.title}-${video.title}`
              )}
            </div>
          `).join("")}
        </div>
      `;

      topicEl.querySelector(".topic-header").onclick = () => {
        topicEl.classList.toggle("active");
      };

      roleSection.appendChild(topicEl);
    });

    root.appendChild(roleSection);
  });
}

/* 🔍 SEARCH FIX */
searchInput.addEventListener("input", render);

/* 🎭 ROLE FILTER FIX + MANAGER LOCK */
roleFilter.addEventListener("change", () => {
  if (roleFilter.value === "manager" && !managerUnlocked) {
    passwordModal.style.display = "flex";
    roleFilter.value = "all";
    return;
  }
  render();
});

/* 🔐 PASSWORD HANDLING */
passwordCancel.onclick = () => {
  passwordModal.style.display = "none";
  passwordInput.value = "";
};

passwordSubmit.onclick = async () => {
  const entered = passwordInput.value.trim();
  if (!entered) return;

  const hash = await sha256(entered);
  if (hash === MANAGER_PASSWORD_HASH) {
    managerUnlocked = true;
    sessionStorage.setItem("mgr_unlocked", "1");
    passwordModal.style.display = "none";
    passwordInput.value = "";
    passwordError.textContent = "";
    roleFilter.value = "manager";
    render();
  } else {
    passwordError.textContent = "Invalid password";
  }
};

/* 🚀 INIT */
render();
