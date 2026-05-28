const API_URL = 'http://localhost:3000/api';

document.getElementById('form-signup').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('input-nombre').value.trim();
  const email = document.getElementById('input-email').value.trim();
  const password = document.getElementById('input-password').value;
  const passwordConfirm = document.getElementById('input-password-confirm').value;
  const avatar = document.querySelector('input[name="avatar"]:checked')?.value || 'bi-person-circle';

  // Validaciones
  if (!nombre || !email || !password || !passwordConfirm) {
    mostrarError('Por favor completa todos los campos');
    return;
  }

  if (password !== passwordConfirm) {
    mostrarError('Las contraseñas no coinciden');
    return;
  }

  if (password.length < 4) {
    mostrarError('La contraseña debe tener al menos 4 caracteres');
    return;
  }

  if (!document.querySelector('input[name="avatar"]:checked')) {
    mostrarError('Por favor selecciona un avatar');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre,
        email,
        password,
        avatar
      })
    });

    const data = await response.json();

    if (data.error) {
      mostrarError(data.error);
      return;
    }

    // Redirigir al login
    mostrarExito('¡Cuenta creada exitosamente! Redirigiendo...');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
  } catch (error) {
    console.error('Error:', error);
    mostrarError('Error de conexión. Intenta nuevamente.');
  }
});

function mostrarError(mensaje) {
  const errorDiv = document.getElementById('mensaje-error');
  errorDiv.textContent = mensaje;
  errorDiv.classList.add('show');

  setTimeout(() => {
    errorDiv.classList.remove('show');
  }, 4000);
}

function mostrarExito(mensaje) {
  const errorDiv = document.getElementById('mensaje-error');
  errorDiv.textContent = mensaje;
  errorDiv.style.background = '#e8f5e9';
  errorDiv.style.color = '#2e7d32';
  errorDiv.style.borderLeftColor = '#2e7d32';
  errorDiv.classList.add('show');
}