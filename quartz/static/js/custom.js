;(function(){
  // when an element with .graph-title > label is clicked
  document.addEventListener("click", function(event) {
    const target = event.target;
    if (target.matches(".graph-title > label")) {
      // add .active to to all elements with same [data-sidebar-focus]
      document.querySelectorAll(`[data-sidebar-focus="${target.dataset.sidebarFocus}"]`).forEach((el) => {
        el.classList.add("active");
      });
      // remove .active from all elements with different [data-sidebar-focus]
      document.querySelectorAll(`[data-sidebar-focus]:not([data-sidebar-focus="${target.dataset.sidebarFocus}"])`).forEach((el) => {
        el.classList.remove("active");
      });
    }
  });
})();