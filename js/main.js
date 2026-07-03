/* ── FAQ accordion ── */

document.querySelectorAll(".faq-question").forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".faq-item");
    const isOpen = item.classList.contains("open");

    document.querySelectorAll(".faq-item.open").forEach((openItem) => {
      openItem.classList.remove("open");
      openItem.querySelector(".faq-question").setAttribute("aria-expanded", "false");
    });

    if (!isOpen) {
      item.classList.add("open");
      button.setAttribute("aria-expanded", "true");
    }
  });
});

/* ── Contact form ── */

const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");

function showFormStatus(message, type) {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.className = `form-status visible ${type}`;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

contactForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(contactForm);
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const subject = formData.get("subject")?.toString().trim();
  const interest = formData.get("interest")?.toString();
  const message = formData.get("message")?.toString().trim();

  if (!name || !email || !message) {
    showFormStatus("Please fill in your name, email, and message.", "error");
    return;
  }

  if (!validateEmail(email)) {
    showFormStatus("Please enter a valid email address.", "error");
    return;
  }

  showFormStatus("Sending your message…", "loading");

  const submitBtn = contactForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    let response;

    if (SITE_CONFIG.web3formsAccessKey) {
      response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: SITE_CONFIG.web3formsAccessKey,
          name,
          email,
          subject: subject || `Yawgoog Story inquiry — ${interest}`,
          message: `Interest: ${interest}\n\n${message}`,
        }),
      });
    } else if (SITE_CONFIG.formspreeId) {
      response = await fetch(`https://formspree.io/f/${SITE_CONFIG.formspreeId}`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });
    } else {
      const mailSubject = encodeURIComponent(subject || `The Yawgoog Story — ${interest}`);
      const mailBody = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nInterest: ${interest}\n\n${message}`
      );
      window.location.href = `mailto:${SITE_CONFIG.contactEmail}?subject=${mailSubject}&body=${mailBody}`;
      showFormStatus(
        "Opening your email app… Configure Formspree or Web3Forms in js/config.js for direct submission.",
        "success"
      );
      submitBtn.disabled = false;
      return;
    }

    const data = await response.json();

    if (response.ok) {
      showFormStatus("Thank you! Your message has been sent. We'll be in touch soon.", "success");
      contactForm.reset();
    } else {
      showFormStatus(data.error || data.message || "Something went wrong. Please try again.", "error");
    }
  } catch {
    showFormStatus(
      "Unable to send right now. Please email us directly at " + SITE_CONFIG.contactEmail,
      "error"
    );
  } finally {
    submitBtn.disabled = false;
  }
});

/* ── Gallery lightbox ── */

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxCaption = document.getElementById("lightbox-caption");
let currentGalleryIndex = 0;
let galleryItems = [];

function renderGallery() {
  const grid = document.getElementById("gallery-grid");
  if (!grid || typeof GALLERY_IMAGES === "undefined") return;

  galleryItems = GALLERY_IMAGES;

  grid.innerHTML = galleryItems
    .map(
      (item, index) => `
      <button class="gallery-item" type="button" data-index="${index}" aria-label="View: ${item.caption}">
        <img src="${item.thumb}" alt="${item.caption}" loading="lazy">
        <span class="gallery-item-caption">${item.caption}</span>
      </button>
    `
    )
    .join("");

  grid.querySelectorAll(".gallery-item").forEach((btn) => {
    btn.addEventListener("click", () => openLightbox(Number(btn.dataset.index)));
  });
}

function openLightbox(index) {
  if (!lightbox || !lightboxImg) return;

  currentGalleryIndex = index;
  const item = galleryItems[index];
  lightboxImg.src = item.full;
  lightboxImg.alt = item.caption;
  lightboxCaption.textContent = item.caption;
  lightbox.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox?.classList.remove("open");
  document.body.style.overflow = "";
  if (lightboxImg) lightboxImg.src = "";
}

function navigateLightbox(direction) {
  currentGalleryIndex =
    (currentGalleryIndex + direction + galleryItems.length) % galleryItems.length;
  openLightbox(currentGalleryIndex);
}

document.getElementById("lightbox-close")?.addEventListener("click", closeLightbox);
document.getElementById("lightbox-prev")?.addEventListener("click", () => navigateLightbox(-1));
document.getElementById("lightbox-next")?.addEventListener("click", () => navigateLightbox(1));

lightbox?.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (e) => {
  if (!lightbox?.classList.contains("open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") navigateLightbox(-1);
  if (e.key === "ArrowRight") navigateLightbox(1);
});

document.addEventListener("DOMContentLoaded", () => {
  renderGallery();
});
