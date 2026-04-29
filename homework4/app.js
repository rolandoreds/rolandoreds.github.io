const templateSelect = document.getElementById("templateSelect");
const nameInput = document.getElementById("nameInput");
const greeting = document.getElementById("greeting");

function applyTemplate(templateValue) {
  document.body.classList.remove("light-blue", "light-gold");

  if (templateValue === "lightblue.jpg") {
    document.body.classList.add("light-blue");
  } else if (templateValue === "lightgold.jpg") {
    document.body.classList.add("light-gold");
  }
}

function updateGreeting(name) {
  if (name) {
    greeting.textContent = `Hi, ${name}, glad to see you back.`;
  } else {
    greeting.textContent = "Hi, glad to see you here.";
  }
}

templateSelect.addEventListener("change", function () {
  const selectedTemplate = templateSelect.value;

  applyTemplate(selectedTemplate);
  localStorage.setItem("template", selectedTemplate);
});

nameInput.addEventListener("blur", function () {
  const typedName = nameInput.value.trim();

  if (typedName !== "") {
    localStorage.setItem("name", typedName);
  }

  const savedName = localStorage.getItem("name");
  updateGreeting(savedName);
});

window.addEventListener("load", function () {
  const savedTemplate = localStorage.getItem("template");
  const savedName = localStorage.getItem("name");

  if (savedTemplate) {
    templateSelect.value = savedTemplate;
    applyTemplate(savedTemplate);
  }

  if (savedName) {
    nameInput.value = savedName;
    updateGreeting(savedName);
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("service-worker.js")
      .then(function (registration) {
        console.log("Service worker registered with scope:", registration.scope);
      })
      .catch(function (error) {
        console.log("Service worker registration failed:", error);
      });
  }
});
