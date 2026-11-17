document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Simulación de verificación de credenciales
        if (username === 'admin' && password === 'password') {
            loginError.textContent = '';
            loginError.style.display = 'none';
            // Animación de éxito
            loginForm.classList.add('success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            loginError.textContent = window.i18n.t('login.error');
            loginError.style.display = 'block';
            // Animación de error
            loginForm.classList.add('error');
            setTimeout(() => {
                loginForm.classList.remove('error');
            }, 500);
        }
    });

    // Si el error ya se muestra, se traduce al cambiar de idioma
    document.addEventListener('i18n:change', function() {
        if (loginError.textContent) {
            loginError.textContent = window.i18n.t('login.error');
        }
    });

    // Efecto de focus en los inputs
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        input.addEventListener('blur', function() {
            if (this.value === '') {
                this.parentElement.classList.remove('focused');
            }
        });
    });
});