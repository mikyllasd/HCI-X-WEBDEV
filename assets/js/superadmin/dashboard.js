document.addEventListener("DOMContentLoaded", () => {
  const dateElement = document.getElementById("currentDate");
  const now = new Date();

  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  // Formatting: Today's Overview - Day, Month Date, Year
  const formattedDate = `Today's Overview - ${now.toLocaleDateString("en-US", options)}`;
  dateElement.textContent = formattedDate;

  // Optional: Add click events for menu items
  const menuItems = document.querySelectorAll(".menu-item");
  menuItems.forEach((item) => {
    item.addEventListener("click", () => {
      menuItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
    });
  });
});
