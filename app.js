const analysisForm = document.getElementById("analysisForm");
const propertyInput = document.getElementById("propertyInput");
const snapshotSection = document.getElementById("snapshotSection");
const snapshotProperty = document.getElementById("snapshotProperty");
const leadModal = document.getElementById("leadModal");
const leadModalTitle = document.getElementById("leadModalTitle");
const leadModalCopy = document.getElementById("leadModalCopy");
const leadIntent = document.getElementById("leadIntent");
const leadForm = document.getElementById("leadForm");
const leadSuccess = document.getElementById("leadSuccess");
const leadSuccessTitle = document.getElementById("leadSuccessTitle");
const leadSuccessCopy = document.getElementById("leadSuccessCopy");
const showingBenefit = document.getElementById("showingBenefit");
const leadSubmitButton = document.getElementById("leadSubmitButton");
const leadFormError = document.getElementById("leadFormError");

const SUBMIT_LEAD_URL = "https://kpbvzifpajcqgjuyvkfg.supabase.co/functions/v1/submit-lead";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwYnZ6aWZwYWpjcWdqdXl2a2ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NTY1MTcsImV4cCI6MjEwMjEzMjUxN30.qajEEZYVqkJnDwuotCtV2LsFgqxowp1E7Jr4wyROb38";

let activeProperty = "";

analysisForm.addEventListener("submit", (event) => {
  event.preventDefault();
  activeProperty = propertyInput.value.trim();
  if (!activeProperty) return;

  snapshotProperty.textContent = activeProperty;
  snapshotSection.classList.remove("hidden");
  setTimeout(() => snapshotSection.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
});

document.querySelectorAll("[data-scroll]").forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.querySelector(button.dataset.scroll);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

function openLeadModal(intent) {
  leadForm.classList.remove("hidden");
  leadSuccess.classList.add("hidden");
  leadFormError.classList.add("hidden");
  leadFormError.textContent = "";
  leadForm.reset();
  leadIntent.value = intent;

  const isShowingRequest = intent === "showing_request";
  showingBenefit.classList.toggle("hidden", !isShowingRequest);

  if (isShowingRequest) {
    leadModalTitle.textContent = "See this home";
    leadModalCopy.textContent = activeProperty
      ? `Request a showing for ${activeProperty}. A local Realtor will contact you to arrange access.`
      : "Request a showing and a local Realtor will contact you to arrange access.";
    leadSubmitButton.textContent = "Request My Showing";
  } else {
    leadModalTitle.textContent = "Get the Full AI Property Brief";
    leadModalCopy.textContent = activeProperty
      ? `Go deeper on ${activeProperty}. Your property is already attached to this request.`
      : "Go deeper with the Full AI Property Brief.";
    leadSubmitButton.textContent = "Get My Full AI Brief";
  }

  leadSubmitButton.disabled = false;
  leadModal.classList.remove("hidden");
}

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => openLeadModal(button.dataset.action));
});

document.querySelector(".modal-close").addEventListener("click", () => leadModal.classList.add("hidden"));

leadModal.addEventListener("click", (event) => {
  if (event.target === leadModal) leadModal.classList.add("hidden");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") leadModal.classList.add("hidden");
});

leadForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(leadForm);
  const mobile = String(formData.get("mobile") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const website = String(formData.get("website") || "").trim();
  const intent = leadIntent.value;

  if (!name || !mobile || !activeProperty) return;

  const originalButtonText = leadSubmitButton.textContent;
  leadSubmitButton.disabled = true;
  leadSubmitButton.textContent = "Sending…";
  leadFormError.classList.add("hidden");
  leadFormError.textContent = "";

  try {
    const response = await fetch(SUBMIT_LEAD_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        property_input: activeProperty,
        name,
        mobile,
        email,
        website,
        conversion_intent: intent,
        page_url: window.location.href,
        referrer: document.referrer || null,
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) {
      throw new Error(result.error || "Unable to send your request right now.");
    }

    leadForm.classList.add("hidden");
    leadSuccess.classList.remove("hidden");

    if (intent === "showing_request") {
      leadSuccessTitle.textContent = "Showing request received.";
      leadSuccessCopy.textContent = "A local Realtor will contact you shortly to arrange access to this home.";
    } else {
      leadSuccessTitle.textContent = "Full AI Property Brief requested.";
      leadSuccessCopy.textContent = "We have your property and contact details ready for the deeper analysis step.";
    }
  } catch (error) {
    leadFormError.textContent = error instanceof Error ? error.message : "Unable to send your request right now.";
    leadFormError.classList.remove("hidden");
    leadSubmitButton.disabled = false;
    leadSubmitButton.textContent = originalButtonText;
  }
});