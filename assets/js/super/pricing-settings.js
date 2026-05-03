(function () {
  const pageContainer = document.getElementById("pageContainer");
  if (!pageContainer || !window.UPressPricing) return;
  pageContainer.innerHTML = UPressPricing.buildPricingSettingsHTML(state.pricing);
  UPressPricing.bindPricingSettingsForm(pageContainer, {
    setPricing: (p) => {
      state.pricing = p;
    },
    persist: persistState,
    showToast: showToast,
  });
})();
