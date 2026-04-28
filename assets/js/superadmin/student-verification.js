/**
 * GLOBAL NAVIGATION
 * This part works on every page (Dashboard, Verification, etc.)
 */
function navigateTo(url) {
  window.location.href = url;
}

/**
 * STUDENT VERIFICATION LOGIC
 * This part only executes if the verification elements exist on the page.
 */
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector(".search-wrapper input");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const requestCards = document.querySelectorAll(".v-card");

  // 1. Filtering Logic (All, Pending, Approved, Rejected)
  if (filterButtons.length > 0) {
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        // UI: Update active button state
        filterButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");

        const selectedFilter = button.textContent.toLowerCase();

        // Logic: Show/Hide cards based on status
        requestCards.forEach((card) => {
          const cardStatus = card
            .querySelector(".badge")
            .textContent.toLowerCase();

          if (selectedFilter === "all") {
            card.style.display = "block";
          } else if (cardStatus.includes(selectedFilter)) {
            card.style.display = "block";
          } else {
            card.style.display = "none";
          }
        });
        updateResultCount();
      });
    });
  }

  // 2. Search Logic (Filtering by Name or Student ID)
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase();

      requestCards.forEach((card) => {
        const studentName = card.querySelector("h4").textContent.toLowerCase();
        const studentDetails = card
          .querySelector(".v-card-body")
          .textContent.toLowerCase();

        if (
          studentName.includes(searchTerm) ||
          studentDetails.includes(searchTerm)
        ) {
          card.style.display = "block";
        } else {
          card.style.display = "none";
        }
      });
      updateResultCount();
    });
  }

  // 3. Helper: Update the "4 requests found" text dynamically
  function updateResultCount() {
    const countLabel = document.querySelector(".results-count");
    const visibleCards = document.querySelectorAll(
      '.v-card[style="display: block;"]',
    ).length;
    // If style is not explicitly set yet, we count them as visible
    const totalVisible = Array.from(requestCards).filter(
      (c) => c.style.display !== "none",
    ).length;

    if (countLabel) {
      countLabel.textContent = `${totalVisible} requests found`;
    }
  }
});
