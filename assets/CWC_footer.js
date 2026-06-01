/* ==============================
   CWC Footer
   LocalizationForm custom element for currency/language selectors.
   Guarded against double-define in case another section already
   registered the same element.
   ============================== */

(function () {
  "use strict";

  if (
    typeof customElements === "undefined" ||
    customElements.get("localization-form")
  ) {
    return;
  }

  class LocalizationForm extends HTMLElement {
    constructor() {
      super();
      this.elements = {
        input: this.querySelector(
          'input[name="locale_code"], input[name="country_code"]',
        ),
        button: this.querySelector("button"),
        panel: this.querySelector(".disclosure__list-wrapper"),
      };

      if (!this.elements.button || !this.elements.panel) return;

      this.elements.button.addEventListener(
        "click",
        this.openSelector.bind(this),
      );
      this.elements.button.addEventListener(
        "focusout",
        this.closeSelector.bind(this),
      );
      this.addEventListener("keyup", this.onContainerKeyUp.bind(this));

      this.querySelectorAll("a").forEach(
        function (item) {
          item.addEventListener("click", this.onItemClick.bind(this));
        }.bind(this),
      );
    }

    hidePanel() {
      this.elements.button.setAttribute("aria-expanded", "false");
      this.elements.panel.setAttribute("hidden", true);
    }

    onContainerKeyUp(event) {
      if (event.code.toUpperCase() !== "ESCAPE") return;
      this.hidePanel();
      this.elements.button.focus();
    }

    onItemClick(event) {
      event.preventDefault();
      var form = this.querySelector("form");
      if (this.elements.input) {
        this.elements.input.value = event.currentTarget.dataset.value;
      }
      if (form) form.submit();
    }

    openSelector() {
      this.elements.button.focus();
      this.elements.panel.toggleAttribute("hidden");
      var current =
        this.elements.button.getAttribute("aria-expanded") === "false";
      this.elements.button.setAttribute("aria-expanded", current.toString());
    }

    closeSelector(event) {
      var shouldClose =
        event.relatedTarget && event.relatedTarget.nodeName === "BUTTON";
      if (event.relatedTarget === null || shouldClose) {
        this.hidePanel();
      }
    }
  }

  customElements.define("localization-form", LocalizationForm);
})();
