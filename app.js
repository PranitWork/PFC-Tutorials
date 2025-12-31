function createVideoItem(video) {
  return `
    <div class="video-item">
      <h4>${video.title}</h4>
      <p>${video.description}</p>
      <iframe src="${video.videoUrl}" allowfullscreen></iframe>
    </div>
  `;
}

function createTopic(topic) {
  const wrapper = document.createElement("div");
  wrapper.className = "tutorial-item";

  wrapper.innerHTML = `
    <div class="tutorial-header">
      <span>${topic.topic}</span>
      <span>+</span>
    </div>
    <div class="tutorial-content">
      ${topic.videos.map(createVideoItem).join("")}
    </div>
  `;

  wrapper.querySelector(".tutorial-header").addEventListener("click", () => {
    wrapper.classList.toggle("active");
  });

  return wrapper;
}

function renderTutorials() {
  const manager = document.getElementById("manager-tutorials");
  const user = document.getElementById("user-tutorials");

  tutorialsData.manager.forEach(t => manager.appendChild(createTopic(t)));
  tutorialsData.user.forEach(t => user.appendChild(createTopic(t)));
}

renderTutorials();
