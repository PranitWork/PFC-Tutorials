const MANAGER_PASSWORD_HASH =
  "f8e11b659dbc47a45acc79e396ac6e4020728e5439fd53c54d934af3e7aa2da1";

let managerUnlocked = sessionStorage.getItem("mgr_unlocked") === "1";

const sidebar = document.querySelector(".sidebar");
const sidebarRoot = document.getElementById("sidebar-root");
const playerRoot = document.getElementById("player-root");
const searchInput = document.getElementById("searchInput");
const roleFilter = document.getElementById("roleFilter");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarOverlay = document.getElementById("sidebarOverlay");

const passwordModal = document.getElementById("passwordModal");
const passwordInput = document.getElementById("managerPasswordInput");
const passwordError = document.getElementById("passwordError");
const passwordCancel = document.getElementById("passwordCancel");
const passwordSubmit = document.getElementById("passwordSubmit");

/* HELPERS */
const isMobile = () => window.innerWidth <= 1024;

const openSidebar = () => {
  sidebar.classList.add("open");
  sidebarOverlay.style.display = "block";
  document.body.classList.add("sidebar-open");
};

const closeSidebar = () => {
  sidebar.classList.remove("open");
  sidebarOverlay.style.display = "none";
  document.body.classList.remove("sidebar-open");
};

const toggleSidebar = () => {
  sidebar.classList.contains("open") ? closeSidebar() : openSidebar();
};


/* VIDEO */
function getVideoEmbed(url) {
  if (url.includes("youtu")) {
    const id = url.includes("youtu.be")
      ? url.split("youtu.be/")[1]
      : new URL(url).searchParams.get("v");
    return `<iframe src="https://www.youtube.com/embed/${id}" allowfullscreen></iframe>`;
  }
  return `<video controls src="${url}"></video>`;
}

/* QUIZ */
function renderQuiz(quiz, key) {
  if (!quiz) return "";

  return `
    <div class="quiz">
      ${quiz.map((q, qi) => `
        <div class="quiz-question">
          <p>${q.question}</p>
          ${q.options.map((opt, oi) => `
            <label class="quiz-option">
              <input type="radio"
                     name="${key}-${qi}"
                     value="${oi}"
                     data-correct="${q.correctIndex}">
              ${opt}
            </label>
          `).join("")}
        </div>
      `).join("")}
      <button class="quiz-submit" onclick="checkQuiz('${key}')">Submit Quiz</button>
      <div class="quiz-result" id="result-${key}"></div>
    </div>
  `;
}

window.checkQuiz = key => {
  let correct = 0;
  let total = 0;

  document.querySelectorAll(".quiz-question").forEach(q => {
    const selected = q.querySelector(`input[name^="${key}"]:checked`);
    const options = q.querySelectorAll(".quiz-option");

    options.forEach(o => o.classList.remove("correct", "wrong"));

    if (!selected) return;
    total++;

    const selectedIndex = +selected.value;
    const correctIndex = +selected.dataset.correct;

    options.forEach((opt, i) => {
      if (i === correctIndex) opt.classList.add("correct");
      if (i === selectedIndex && selectedIndex !== correctIndex) {
        opt.classList.add("wrong");
      }
    });

    if (selectedIndex === correctIndex) correct++;
  });

  document.getElementById(`result-${key}`).textContent =
    correct === total
      ? `✅ Perfect! ${correct}/${total}`
      : `❌ ${correct}/${total} correct. Correct answers highlighted above.`;
};

/* PLAY VIDEO */
function playVideo(video, key) {
  playerRoot.innerHTML = `
    <h2>${video.title}</h2>
    <p>${video.description}</p>
    <div class="video-frame">${getVideoEmbed(video.url)}</div>
    ${renderQuiz(video.quiz, key)}
  `;
}

/* RENDER SIDEBAR */
function render() {
  sidebarRoot.innerHTML = "";
  const query = searchInput.value.toLowerCase().trim();
  const role = roleFilter.value;

  TUTORIAL_CONTENT.forEach(section => {
    if (section.role === "manager" && !managerUnlocked) return;
    if (role !== "all" && role !== section.role) return;

    sidebarRoot.insertAdjacentHTML("beforeend", `<h4>${section.roleLabel}</h4>`);

    section.topics.forEach(topic => {
      const matches = topic.videos.filter(v =>
        !query ||
        topic.title.toLowerCase().includes(query) ||
        v.title.toLowerCase().includes(query)
      );
      if (!matches.length) return;

      const header = document.createElement("div");
      header.className = "sidebar-topic-header";
      header.textContent = topic.title;

      const list = document.createElement("div");
      list.className = "sidebar-video-list open";

      matches.forEach(video => {
        const item = document.createElement("div");
        item.className = "sidebar-video";
        item.textContent = video.title;
        item.onclick = () => {
          playVideo(video, `${section.role}-${topic.title}`);
          if (isMobile()) closeSidebar();
        };
        list.appendChild(item);
      });

      header.onclick = () => {
        document.querySelectorAll(".sidebar-video-list.open")
          .forEach(l => l !== list && l.classList.remove("open"));
        list.classList.toggle("open");
      };

      sidebarRoot.append(header, list);
    });
  });
}

/* EVENTS */
searchInput.addEventListener("input", () => {
  if (isMobile()) openSidebar();
  render();
});

roleFilter.addEventListener("change", () => {
  if (roleFilter.value === "manager" && !managerUnlocked) {
    passwordModal.style.display = "flex";
    roleFilter.value = "all";
    return;
  }
  render();
});

passwordCancel.onclick = () => passwordModal.style.display = "none";

passwordSubmit.onclick = async () => {
  const data = new TextEncoder().encode(passwordInput.value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hex = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  if (hex === MANAGER_PASSWORD_HASH) {
    managerUnlocked = true;
    sessionStorage.setItem("mgr_unlocked", "1");
    passwordModal.style.display = "none";
    roleFilter.value = "manager";
    render();
  } else {
    passwordError.textContent = "Invalid password";
  }
};

sidebarToggle.onclick = openSidebar;
sidebarOverlay.onclick = closeSidebar;

render();
