document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const removeParticipantModal = document.getElementById("remove-participant-modal");
  const removeParticipantMessage = document.getElementById("remove-participant-message");
  const confirmRemoveButton = document.getElementById("confirm-remove-participant");
  const cancelRemoveButton = document.getElementById("cancel-remove-participant");

  let pendingRemoval = null;
  let messageHideTimeoutId = null;

  function showMessage(text, kind) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${kind}`;
    messageDiv.classList.remove("hidden");

    if (messageHideTimeoutId !== null) {
      clearTimeout(messageHideTimeoutId);
    }

    messageHideTimeoutId = window.setTimeout(() => {
      messageDiv.classList.add("hidden");
      messageHideTimeoutId = null;
    }, 5000);
  }

  function openRemoveParticipantModal(activity, email) {
    pendingRemoval = { activity, email };
    removeParticipantMessage.textContent = `Do you want to remove ${email} from ${activity}?`;
    removeParticipantModal.classList.remove("hidden");
    confirmRemoveButton.focus();
  }

  function closeRemoveParticipantModal() {
    pendingRemoval = null;
    removeParticipantModal.classList.add("hidden");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const escapeHtml = (value) =>
          String(value).replace(/[&<>"']/g, (char) => {
            switch (char) {
              case "&":
                return "&amp;";
              case "<":
                return "&lt;";
              case ">":
                return "&gt;";
              case '"':
                return "&quot;";
              default:
                return "&#39;";
            }
          });

        const safeActivityName = escapeHtml(name);

        const participantsList =
          details.participants.length > 0
            ? details.participants
                .map((participant) => {
                  const safeParticipant = escapeHtml(participant);

                  return `
                    <li class="participant-item">
                      <span class="participant-email">${safeParticipant}</span>
                      <button
                        type="button"
                        class="participant-remove"
                        data-activity="${safeActivityName}"
                        data-email="${safeParticipant}"
                        aria-label="Remove ${safeParticipant} from ${safeActivityName}"
                        title="Remove participant"
                      >
                        Remove
                      </button>
                    </li>
                  `;
                })
                .join("")
            : '<li class="participants-empty">No participants yet</li>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p class="activity-meta"><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="activity-meta"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p class="participants-title">Current Participants</p>
            <ul class="participants-list">
              ${participantsList}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".participant-remove");

    if (!removeButton) {
      return;
    }

    const { activity, email } = removeButton.dataset;
    openRemoveParticipantModal(activity, email);
  });

  cancelRemoveButton.addEventListener("click", () => {
    closeRemoveParticipantModal();
  });

  confirmRemoveButton.addEventListener("click", async () => {
    const removal = pendingRemoval;
    closeRemoveParticipantModal();

    if (!removal) {
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(removal.activity)}/signup?email=${encodeURIComponent(removal.email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to remove participant. Please try again.", "error");
      console.error("Error removing participant:", error);
    }
  });

  removeParticipantModal.addEventListener("click", (event) => {
    if (event.target === removeParticipantModal) {
      closeRemoveParticipantModal();
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
