const form = document.getElementById("webinar-form");
const statusBox = document.getElementById("form-status");
const config = window.SCALEUP_CONFIG || {};
const requestMode = config.requestMode || "no-cors";

const setStatus = (message, isError = false) => {
  statusBox.textContent = message;
  statusBox.style.color = isError ? "#a23f2d" : "#356046";
};

const validateForm = (payload) => {
  if (!payload.fullName.trim()) {
    return "צריך למלא שם מלא.";
  }

  if (!payload.email.trim()) {
    return "צריך למלא כתובת אימייל.";
  }

  if (!payload.privacyConsent) {
    return "צריך לאשר את מדיניות הפרטיות כדי להירשם.";
  }

  return "";
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  payload.privacyConsent = formData.get("privacyConsent") === "on";
  payload.submittedAt = new Date().toISOString();
  payload.pageUrl = window.location.href;
  payload.source = config.source || "scaleup-webinar";

  const validationError = validateForm(payload);
  if (validationError) {
    setStatus(validationError, true);
    return;
  }

  if (!config.webhookUrl) {
    setStatus("הטופס מוכן, אבל עדיין צריך להגדיר webhook ב-config.js כדי לקבל לידים לשיטס.", true);
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "שולחים...";
  setStatus("");

  try {
    const fetchOptions = {
      method: "POST",
      mode: requestMode,
      headers: {
        "Content-Type": requestMode === "no-cors" ? "text/plain;charset=utf-8" : "application/json",
      },
      body: JSON.stringify(payload),
    };

    const response = await fetch(config.webhookUrl, fetchOptions);

    if (requestMode !== "no-cors" && !response.ok) {
      throw new Error(`Webhook request failed with status ${response.status}`);
    }

    form.reset();
    setStatus(config.successMessage || "נרשמתם בהצלחה.");
  } catch (error) {
    console.error(error);
    setStatus("השליחה לא הושלמה. בדקו את כתובת ה-webhook ונסו שוב.", true);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "שמור מקום בוובינר";
  }
});
