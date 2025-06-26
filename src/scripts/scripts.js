// scripts/scripts.js
(() => {
  // espera al DOM listo si prefieres más seguridad
  document.addEventListener('DOMContentLoaded', () => {
    /* ------------- Hamburguesa ------------- */
    const toggle  = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    toggle?.addEventListener('click', () => {
      navMenu?.classList.toggle('hidden');
      navMenu?.classList.toggle('opacity-0');
      navMenu?.classList.toggle('-translate-y-4');
    });

    /* ------------- AOS ------------- */
    AOS.init({ duration: 600, once: true, offset: 120 });
  });
})();
