(() => {
  document.addEventListener('DOMContentLoaded', () => {

    /* ░░░ Hamburguesa ░░░ */
    const toggle  = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    const hideMenu = () => navMenu.classList.add('hidden','opacity-0','-translate-y-4');

    toggle?.addEventListener('click', () => {
      navMenu.classList.toggle('hidden');
      navMenu.classList.toggle('opacity-0');
      navMenu.classList.toggle('-translate-y-4');
    });

    navMenu?.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => {
        if (window.matchMedia('(max-width:767.98px)').matches) hideMenu();
      })
    );

    document.addEventListener('click', e => {
      const open   = !navMenu.classList.contains('hidden');
      const inside = navMenu.contains(e.target) || toggle.contains(e.target);
      if (open && !inside) hideMenu();
    });

    /* ░░░ Formulario ░░░ */
    const form  = document.getElementById('contactForm');
    const input = document.getElementById('mensajeInput');
    const box   = document.getElementById('formAlert');

    const showAlert = (msg, type='error', pos='top') => {
      // Posición: top o bottom
      box.classList.toggle('top-20',    pos==='top');
      box.classList.toggle('bottom-20', pos==='bottom');

      // Color: verde éxito / rojo error
      box.classList.toggle('bg-green-600', type==='success');
      box.classList.toggle('bg-red-600',   type!=='success');

      box.textContent = msg;
      box.classList.remove('hidden', 'opacity-0');
      box.style.opacity = '1';

      // Ocultar tras 4 s
      setTimeout(() => {
        box.style.opacity = '0';
        setTimeout(() => box.classList.add('hidden'), 300);
      }, 4000);
    };

    form?.addEventListener('submit', e => {
      e.preventDefault();
      const txt = input.value.trim();

      if (txt.length < 5 || txt.length > 200) {
        showAlert('⚠️ Escribe un mensaje de 5 a 200 caracteres.','error','bottom');
        return;
      }

      window.location.href =
        `mailto:contacto@timbrado.io?subject=Solicitud%20de%20demo&body=${encodeURIComponent(txt)}`;

      showAlert('✅ Correo de contacto preparado.','success','bottom');
      input.value = '';
    });

    /* ░░░ AOS ░░░ */
    AOS.init({ duration: 600, once: true, offset: 120 });
  });
})();
