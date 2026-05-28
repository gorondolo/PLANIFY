const API_URL = 'http://localhost:3000/api';

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('input-email').value.trim();
  const password = document.getElementById('input-password').value.trim();

  if (!email || !password) {
    mostrarError('Por favor completa todos los campos');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.error) {
      mostrarError(data.error);
      return;
    }

    // Guardar datos del usuario
    localStorage.setItem('usuario_id', data.usuario_id);
    localStorage.setItem('usuario_nombre', data.usuario_nombre);
    localStorage.setItem('usuario_email', data.usuario_email);
    localStorage.setItem('usuario_avatar', data.usuario_avatar || 'bi-person-circle');

    // Redirigir al dashboard
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Error:', error);
    mostrarError('Error de conexión. Intenta nuevamente.');
  }
});

// Toggle mostrar/ocultar contraseña
document.getElementById('btn-toggle-pass').addEventListener('click', (e) => {
  e.preventDefault();
  const input = document.getElementById('input-password');
  const btn = document.getElementById('btn-toggle-pass');

  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = '<i class="bi bi-eye-slash"></i>';
  } else {
    input.type = 'password';
    btn.innerHTML = '<i class="bi bi-eye"></i>';
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