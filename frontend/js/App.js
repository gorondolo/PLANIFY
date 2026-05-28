const API_URL = 'http://localhost:3000/api';

// Variables globales
let usuarioId = null;
let tareas = [];
let materias = [];
let editandoTareaId = null;
let editandoMateriaId = null;
let filtroActual = 'todas';
let filtroActualDashboard = 'todas';
let mesActual = new Date();

document.addEventListener('DOMContentLoaded', () => {
  usuarioId = localStorage.getItem('usuario_id');

  if (!usuarioId) {
    window.location.href = 'login.html';
    return;
  }

  // Mostrar avatar y nombre del usuario
  const nombreUsuario = localStorage.getItem('usuario_nombre') || 'Usuario';
  const avatarIcon = localStorage.getItem('usuario_avatar') || 'bi-person-circle';
  
  document.querySelectorAll('#usuario-nombre').forEach(el => {
    el.innerHTML = `<i class="bi ${avatarIcon}" style="font-size: 1.3rem; margin-right: 0.5rem;"></i>${nombreUsuario}`;
  });

  // Determinar qué página se está cargando
  const pagina = window.location.pathname.split('/').pop();

  if (pagina === 'index.html' || pagina === '') {
    inicializarDashboard();
  } else if (pagina === 'tareas.html') {
    inicializarTareas();
  } else if (pagina === 'materias.html') {
    inicializarMaterias();
  } else if (pagina === 'calendario.html') {
    inicializarCalendario();
  }

  // Inicializar burger menu
  inicializarBurger();
});

// ===== BURGER MENU =====
function inicializarBurger() {
  const burger = document.querySelector('#navbar-burger');
  const menu = document.querySelector('#navbarMenu');
  
  if (burger) {
    burger.addEventListener('click', () => {
      menu.classList.toggle('is-active');
    });
  }
}

// ===== DASHBOARD =====
function inicializarDashboard() {
  inicializarModal('modalTarea');
  cargarTareas().then(() => {
    cargarMaterias().then(() => {
      llenarSelectMaterias();
      renderizarDashboard();
      actualizarEstadisticas();
    });
  });

  document.querySelector('#btn-abrir-modal')?.addEventListener('click', () => {
    editandoTareaId = null;
    document.querySelector('#modalTarea').classList.add('is-active');
  });

  document.querySelector('#btn-guardar-tarea')?.addEventListener('click', guardarTarea);
}

function renderizarDashboard() {
  const contenedor = document.querySelector('#lista-tareas-dashboard');
  if (!contenedor) return;

  contenedor.innerHTML = '';

  let tareasAMostrar = tareas;
  
  if (filtroActualDashboard === 'pendientes') {
    tareasAMostrar = tareas.filter(t => !t.completada);
  } else if (filtroActualDashboard === 'completadas') {
    tareasAMostrar = tareas.filter(t => t.completada);
  } else if (filtroActualDashboard === 'urgentes') {
    tareasAMostrar = tareas.filter(t => esUrgente(t));
  }

  if (tareasAMostrar.length === 0) {
    contenedor.innerHTML = '<p style="text-align: center; padding: 2rem; color: #999;">📭 No hay tareas. ¡Crea una nueva!</p>';
    return;
  }

  tareasAMostrar.slice(0, 5).forEach(tarea => {
    const tarjeta = crearTarjetaTarea(tarea);
    contenedor.innerHTML += tarjeta;
  });
}

function actualizarEstadisticas() {
  const total = tareas.length;
  const pendientes = tareas.filter(t => !t.completada).length;
  const completadas = tareas.filter(t => t.completada).length;
  const urgentes = tareas.filter(t => esUrgente(t)).length;

  document.querySelector('#stat-total').textContent = total;
  document.querySelector('#stat-pendientes').textContent = pendientes;
  document.querySelector('#stat-completadas').textContent = completadas;
  document.querySelector('#stat-urgentes').textContent = urgentes;

  document.querySelector('#titulo-saludo').textContent = `¡Hola, ${localStorage.getItem('usuario_nombre')}! 👋`;
}

function filtrarDashboard(filtro) {
  filtroActualDashboard = filtro;
  
  const titulos = {
    'todas': 'Todas tus tareas',
    'pendientes': 'Tareas pendientes',
    'completadas': 'Tareas completadas',
    'urgentes': 'Tareas urgentes'
  };
  
  document.querySelector('#titulo-lista').textContent = titulos[filtro];
  renderizarDashboard();
}

// ===== TAREAS =====
function inicializarTareas() {
  inicializarModal('modalTarea');
  cargarTareas().then(() => {
    cargarMaterias().then(() => {
      llenarSelectMaterias();
      renderizarTareasPagina();
    });
  });

  document.querySelector('#btn-nueva-tarea')?.addEventListener('click', () => {
    editandoTareaId = null;
    document.querySelector('#modalTarea').classList.add('is-active');
  });

  document.querySelector('#btn-guardar-tarea')?.addEventListener('click', guardarTarea);
}

function renderizarTareasPagina() {
  const contenedor = document.querySelector('#lista-tareas-grilla');
  if (!contenedor) return;

  contenedor.innerHTML = '';

  let tareasAMostrar = tareas;
  if (filtroActual === 'pendientes') {
    tareasAMostrar = tareas.filter(t => !t.completada);
  } else if (filtroActual === 'completadas') {
    tareasAMostrar = tareas.filter(t => t.completada);
  } else if (filtroActual === 'urgentes') {
    tareasAMostrar = tareas.filter(t => esUrgente(t));
  }

  if (tareasAMostrar.length === 0) {
    contenedor.innerHTML = '<div class="column is-full"><p style="text-align: center; padding: 2rem;">📭 No hay tareas en esta categoría</p></div>';
    return;
  }

  tareasAMostrar.forEach(tarea => {
    const div = document.createElement('div');
    div.className = 'column is-one-third-desktop is-half-tablet';
    div.innerHTML = crearTarjetaTarea(tarea);
    contenedor.appendChild(div);
  });
}

function crearTarjetaTarea(tarea) {
  const fechaFormato = tarea.fecha_entrega 
    ? new Date(tarea.fecha_entrega).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    : 'Sin fecha';

  const clasePrioridad = `tarea-${tarea.prioridad}`;
  const claseCompletada = tarea.completada ? 'tarea-completada' : '';
  const colorMateria = obtenerColorMateria(tarea.materia_id);

  return `
    <article class="tarea-card ${clasePrioridad} ${claseCompletada}">
      <div class="tarea-top-stripe" style="background-color: ${colorMateria};"></div>
      <header class="tarea-card-header">
        <div class="tarea-icono" style="background-color: ${colorMateria};">
          <i class="bi bi-check"></i>
        </div>
        <span class="badge-prioridad prioridad-${tarea.prioridad}">${tarea.prioridad.toUpperCase()}</span>
      </header>
      <div class="tarea-card-body">
        <h3 class="tarea-titulo">${tarea.titulo}</h3>
        <div class="tarea-meta-row">
          <i class="bi bi-bookmark-fill"></i>
          <span class="materia-name">${tarea.materias?.nombre || 'Sin materia'}</span>
        </div>
        <div class="tarea-meta-row">
          <i class="bi bi-calendar-event"></i>
          <span>${fechaFormato}</span>
        </div>
      </div>
      <footer class="tarea-card-footer">
        <label class="tarea-completar">
          <input type="checkbox" ${tarea.completada ? 'checked' : ''} onchange="completarTarea(${tarea.id}, this.checked)">
          <span>Completar</span>
        </label>
        <div class="tarea-acciones">
          <button class="button is-small is-light" onclick="editarTarea(${tarea.id})" title="Editar">
            <i class="bi bi-pencil has-text-info"></i>
          </button>
          <button class="button is-small is-light" onclick="eliminarTarea(${tarea.id})" title="Eliminar">
            <i class="bi bi-trash has-text-danger"></i>
          </button>
        </div>
      </footer>
    </article>
  `;
}

async function cargarTareas() {
  try {
    const response = await fetch(`${API_URL}/tareas/${usuarioId}`);
    const data = await response.json();

    if (!data.error) {
      tareas = data.tareas || [];
    }
  } catch (err) {
    console.error('Error cargando tareas:', err);
  }
}

async function guardarTarea() {
  const modal = document.querySelector('#modalTarea');
  const form = modal.querySelector('form');
  const inputs = form.querySelectorAll('input, textarea, select');

  const titulo = inputs[0].value.trim();
  const descripcion = inputs[1].value.trim();
  const materia_id = inputs[2].value ? parseInt(inputs[2].value) : null;
  const fecha_entrega = inputs[3].value;
  const prioridad = inputs[4].value;

  if (!titulo) {
    error('Por favor completa el título de la tarea');
    return;
  }

  try {
    if (editandoTareaId) {
      const response = await fetch(`${API_URL}/tareas/${editandoTareaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          descripcion,
          fecha_entrega: fecha_entrega || null,
          prioridad
        })
      });

      const data = await response.json();
      if (!data.error) {
        exito('Tarea actualizada');
      }
    } else {
      const response = await fetch(`${API_URL}/tareas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: usuarioId,
          materia_id: materia_id,
          titulo,
          descripcion,
          fecha_entrega: fecha_entrega || null,
          prioridad: prioridad || 'media'
        })
      });

      const data = await response.json();
      if (!data.error) {
        exito('Tarea creada');
      }
    }

    form.reset();
    modal.classList.remove('is-active');
    cargarTareas().then(() => {
      const pagina = window.location.pathname.split('/').pop();
      if (pagina === 'index.html' || pagina === '') {
        renderizarDashboard();
        actualizarEstadisticas();
      } else if (pagina === 'tareas.html') {
        renderizarTareasPagina();
      }
    });
  } catch (err) {
    console.error('Error:', err);
    error('Error: ' + err.message);
  }
}

function editarTarea(id) {
  const tarea = tareas.find(t => t.id === id);
  if (!tarea) return;

  const modal = document.querySelector('#modalTarea');
  const form = modal.querySelector('form');
  const inputs = form.querySelectorAll('input, textarea, select');

  inputs[0].value = tarea.titulo;
  inputs[1].value = tarea.descripcion || '';
  inputs[2].value = tarea.materia_id || '';
  inputs[3].value = tarea.fecha_entrega || '';
  inputs[4].value = tarea.prioridad;

  editandoTareaId = id;
  modal.classList.add('is-active');
}

async function completarTarea(id, completada) {
  try {
    const response = await fetch(`${API_URL}/tareas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completada })
    });

    const data = await response.json();
    if (!data.error) {
      cargarTareas().then(() => {
        const pagina = window.location.pathname.split('/').pop();
        if (pagina === 'index.html' || pagina === '') {
          renderizarDashboard();
          actualizarEstadisticas();
        } else if (pagina === 'tareas.html') {
          renderizarTareasPagina();
        }
      });
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

async function eliminarTarea(id) {
  if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) return;

  try {
    const response = await fetch(`${API_URL}/tareas/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json();
    if (!data.error) {
      exito('Tarea eliminada');
      cargarTareas().then(() => {
        const pagina = window.location.pathname.split('/').pop();
        if (pagina === 'index.html' || pagina === '') {
          renderizarDashboard();
          actualizarEstadisticas();
        } else if (pagina === 'tareas.html') {
          renderizarTareasPagina();
        }
      });
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

function filtrarTareas(filtro) {
  filtroActual = filtro;
  renderizarTareasPagina();
}

// ===== MATERIAS =====
function inicializarMaterias() {
  inicializarModal('modalMateria');
  inicializarModal('modalTareasPorMateria');
  cargarTareas().then(() => {
    cargarMaterias().then(() => {
      renderizarMaterias();
    });
  });

  document.querySelector('#btn-nueva-materia')?.addEventListener('click', () => {
    editandoMateriaId = null;
    document.querySelector('#modalMateria').classList.add('is-active');
  });

  document.querySelector('#btn-guardar-materia')?.addEventListener('click', guardarMateria);
}

function renderizarMaterias() {
  const contenedor = document.querySelector('#lista-materias');
  if (!contenedor) return;

  contenedor.innerHTML = '';

  if (materias.length === 0) {
    contenedor.innerHTML = '<div class="column is-full"><p style="text-align: center; padding: 2rem;">📚 No tienes materias aún. ¡Crea una nueva!</p></div>';
    return;
  }

  materias.forEach(materia => {
    const tareasDeMateria = tareas.filter(t => t.materia_id === materia.id).length;
    
    const div = document.createElement('div');
    div.className = 'column is-one-third-desktop is-half-tablet';
    div.innerHTML = `
      <div class="card" style="border-top: 4px solid ${materia.color}; cursor: pointer; transition: all 0.3s;" onclick="mostrarTareasPorMateria(${materia.id})" onmouseover="this.style.boxShadow='0 4px 15px rgba(0,0,0,0.15)'" onmouseout="this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'">
        <div class="card-content">
          <div class="level is-mobile mb-3">
            <div class="level-left">
              <div class="level-item">
                <h3 class="title is-5">${materia.nombre}</h3>
              </div>
            </div>
            <div class="level-right">
              <button class="button is-small is-light" onclick="event.stopPropagation(); editarMateria(${materia.id})" title="Editar">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="button is-small is-light" onclick="event.stopPropagation(); eliminarMateria(${materia.id})" title="Eliminar">
                <i class="bi bi-trash has-text-danger"></i>
              </button>
            </div>
          </div>
          <p class="mb-2"><strong>Profesor:</strong> ${materia.profesor || 'Sin asignar'}</p>
          <p class="mb-2"><strong>Horario:</strong> ${materia.horario || 'Sin horario'}</p>
          <p class="mb-2"><strong>Tareas:</strong> <span class="tag is-info">${tareasDeMateria} ${tareasDeMateria === 1 ? 'tarea' : 'tareas'}</span></p>
          <div class="color-preview" style="width: 100%; height: 20px; background-color: ${materia.color}; border-radius: 4px;"></div>
        </div>
      </div>
    `;
    contenedor.appendChild(div);
  });
}

async function cargarMaterias() {
  try {
    const response = await fetch(`${API_URL}/materias/${usuarioId}`);
    const data = await response.json();

    if (!data.error) {
      materias = data.materias || [];
    }
  } catch (error) {
    console.error('Error cargando materias:', error);
  }
}

async function guardarMateria() {
  const modal = document.querySelector('#modalMateria');
  const form = modal.querySelector('form');
  const inputs = form.querySelectorAll('input');

  const nombre = inputs[0].value.trim();
  const profesor = inputs[1].value.trim();
  const color = inputs[2].value;
  const horario = inputs[3].value.trim();

  if (!nombre) {
    error('Por favor completa el nombre de la materia');
    return;
  }

  try {
    if (editandoMateriaId) {
      const response = await fetch(`${API_URL}/materias/${editandoMateriaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          profesor,
          color,
          horario
        })
      });

      const data = await response.json();
      if (!data.error) {
        exito('Materia actualizada');
      }
    } else {
      const response = await fetch(`${API_URL}/materias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: usuarioId,
          nombre,
          profesor,
          color,
          horario
        })
      });

      const data = await response.json();
      if (!data.error) {
        exito('Materia creada');
      }
    }

    form.reset();
    modal.classList.remove('is-active');
    cargarMaterias().then(() => {
      renderizarMaterias();
    });
  } catch (err) {
    console.error('Error:', err);
    error('Error: ' + err.message);
  }
}

function editarMateria(id) {
  const materia = materias.find(m => m.id === id);
  if (!materia) return;

  const modal = document.querySelector('#modalMateria');
  const form = modal.querySelector('form');
  const inputs = form.querySelectorAll('input');

  inputs[0].value = materia.nombre;
  inputs[1].value = materia.profesor || '';
  inputs[2].value = materia.color;
  inputs[3].value = materia.horario || '';

  editandoMateriaId = id;
  modal.classList.add('is-active');
}

async function eliminarMateria(id) {
  if (!confirm('¿Estás seguro de que quieres eliminar esta materia?')) return;

  try {
    const response = await fetch(`${API_URL}/materias/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json();
    if (!data.error) {
      exito('Materia eliminada');
      cargarMaterias().then(() => {
        renderizarMaterias();
      });
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

function mostrarTareasPorMateria(materiaId) {
  const materia = materias.find(m => m.id === materiaId);
  const tareasDeMateria = tareas.filter(t => t.materia_id === materiaId);
  
  const modal = document.querySelector('#modalTareasPorMateria');
  const contenedor = document.querySelector('#lista-tareas-materia');
  
  document.querySelector('#modal-tareas-titulo').textContent = `Tareas de ${materia.nombre}`;
  
  contenedor.innerHTML = '';
  
  if (tareasDeMateria.length === 0) {
    contenedor.innerHTML = '<p style="text-align: center; color: #999;">📭 No hay tareas asignadas a esta materia</p>';
  } else {
    tareasDeMateria.forEach(tarea => {
      const fechaFormato = tarea.fecha_entrega 
        ? new Date(tarea.fecha_entrega).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
        : 'Sin fecha';
      
      const li = document.createElement('div');
      li.className = 'mb-3 p-3 has-background-light';
      li.style.borderRadius = '6px';
      li.style.borderLeft = `4px solid ${materia.color}`;
      li.innerHTML = `
        <div class="level is-mobile">
          <div class="level-left">
            <div style="flex-grow: 1;">
              <h4 class="title is-6 mb-1">${tarea.titulo}</h4>
              <p class="subtitle is-7 mb-1">${tarea.descripcion || 'Sin descripción'}</p>
              <p class="subtitle is-7">
                <i class="bi bi-calendar-event mr-1"></i>${fechaFormato}
                <span class="tag is-${tarea.prioridad === 'alta' ? 'danger' : tarea.prioridad === 'media' ? 'warning' : 'info'} ml-2">${tarea.prioridad.toUpperCase()}</span>
              </p>
            </div>
          </div>
          <div class="level-right">
            <label>
              <input type="checkbox" ${tarea.completada ? 'checked' : ''} onchange="completarTarea(${tarea.id}, this.checked)">
            </label>
          </div>
        </div>
      `;
      contenedor.appendChild(li);
    });
  }
  
  modal.classList.add('is-active');
}

// ===== CALENDARIO =====
function inicializarCalendario() {
  cargarTareas().then(() => {
    renderizarCalendario();
  });

  document.querySelector('#btn-mes-anterior')?.addEventListener('click', () => {
    mesActual.setMonth(mesActual.getMonth() - 1);
    renderizarCalendario();
  });

  document.querySelector('#btn-mes-siguiente')?.addEventListener('click', () => {
    mesActual.setMonth(mesActual.getMonth() + 1);
    renderizarCalendario();
  });
}

function renderizarCalendario() {
  const mes = mesActual.getMonth();
  const ano = mesActual.getFullYear();
  
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  document.querySelector('#mes-actual').textContent = `${meses[mes]} ${ano}`;

  const primerDia = new Date(ano, mes, 1).getDay();
  const diasEnMes = new Date(ano, mes + 1, 0).getDate();

  const contenedor = document.querySelector('#dias-mes');
  contenedor.innerHTML = '';

  const diasMesAnterior = new Date(ano, mes, 0).getDate();
  for (let i = primerDia - 1; i >= 0; i--) {
    const dia = document.createElement('div');
    dia.className = 'dia dia-otro-mes';
    dia.innerHTML = diasMesAnterior - i;
    contenedor.appendChild(dia);
  }

  const hoy = new Date();
  for (let d = 1; d <= diasEnMes; d++) {
    const dia = document.createElement('div');
    const claseHoy = (d === hoy.getDate() && mes === hoy.getMonth() && ano === hoy.getFullYear()) ? 'dia-hoy' : '';
    dia.className = `dia ${claseHoy}`;
    dia.innerHTML = `<div class="dia-numero">${d}</div>`;
    
    const fechaStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const tareasDelDia = tareas.filter(t => t.fecha_entrega?.startsWith(fechaStr)).length;
    
    if (tareasDelDia > 0) {
      dia.innerHTML += `<div class="dia-tareas">📌 ${tareasDelDia}</div>`;
    }

    dia.addEventListener('click', () => {
      mostrarTareasDelDia(fechaStr);
    });

    contenedor.appendChild(dia);
  }

  const diasFaltantes = 42 - (primerDia + diasEnMes);
  for (let i = 1; i <= diasFaltantes; i++) {
    const dia = document.createElement('div');
    dia.className = 'dia dia-otro-mes';
    dia.innerHTML = i;
    contenedor.appendChild(dia);
  }
}

function mostrarTareasDelDia(fecha) {
  const tareasDelDia = tareas.filter(t => t.fecha_entrega?.startsWith(fecha));
  const contenedor = document.querySelector('#tareas-dia-seleccionado');
  const fechaFormato = new Date(fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  document.querySelector('#fecha-seleccionada').textContent = fechaFormato;
  contenedor.innerHTML = '';

  if (tareasDelDia.length === 0) {
    contenedor.innerHTML = '<p style="color: #999;">📭 No hay tareas para este día</p>';
    return;
  }

  tareasDelDia.forEach(tarea => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="level is-mobile">
        <div class="level-left">
          <span class="badge badge-${tarea.prioridad} mr-2">${tarea.prioridad.toUpperCase()}</span>
          <strong>${tarea.titulo}</strong>
        </div>
        <div class="level-right">
          <label>
            <input type="checkbox" ${tarea.completada ? 'checked' : ''} onchange="completarTarea(${tarea.id}, this.checked)">
          </label>
        </div>
      </div>
    `;
    contenedor.appendChild(li);
  });
}

// ===== UTILIDADES =====
function inicializarModal(idModal) {
  const modal = document.querySelector(`#${idModal}`);
  if (!modal) return;

  const botonesClose = modal.querySelectorAll('[data-close-modal]');
  botonesClose.forEach(btn => {
    btn.addEventListener('click', () => {
      modal.classList.remove('is-active');
    });
  });

  modal.querySelector('.modal-background').addEventListener('click', () => {
    modal.classList.remove('is-active');
  });
}

function llenarSelectMaterias() {
  const selects = document.querySelectorAll('#select-materia-tarea');
  
  selects.forEach(select => {
    select.innerHTML = '<option value="">-- Selecciona una materia --</option>';
    
    materias.forEach(materia => {
      const option = document.createElement('option');
      option.value = materia.id;
      option.textContent = materia.nombre;
      select.appendChild(option);
    });
  });
}

function obtenerColorMateria(materiaId) {
  const materia = materias.find(m => m.id === materiaId);
  return materia?.color || '#4A90D9';
}

function esUrgente(tarea) {
  if (tarea.prioridad === 'alta') return true;

  if (tarea.fecha_entrega) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const fechaTarea = new Date(tarea.fecha_entrega);
    fechaTarea.setHours(0, 0, 0, 0);
    
    const diferenciaDias = Math.ceil((fechaTarea - hoy) / (1000 * 60 * 60 * 24));
    
    return diferenciaDias <= 3 && diferenciaDias >= 0;
  }

  return false;
}

function logout() {
  if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
    localStorage.removeItem('usuario_id');
    localStorage.removeItem('usuario_nombre');
    localStorage.removeItem('usuario_email');
    localStorage.removeItem('usuario_avatar');
    window.location.href = 'login.html';
  }
}

// ===== NOTIFICACIONES =====
function mostrarNotificacion(mensaje, tipo = 'info', duracion = 3000) {
  let container = document.querySelector('.notificaciones-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'notificaciones-container';
    document.body.appendChild(container);
  }

  const notif = document.createElement('div');
  notif.className = `notificacion ${tipo}`;

  const iconos = {
    exito: '<i class="bi bi-check-circle"></i>',
    error: '<i class="bi bi-x-circle"></i>',
    info: '<i class="bi bi-info-circle"></i>',
    advertencia: '<i class="bi bi-exclamation-circle"></i>'
  };

  notif.innerHTML = `
    <span class="icono">${iconos[tipo]}</span>
    <span class="texto">${mensaje}</span>
    <button class="cerrar" onclick="this.parentElement.remove()">
      <i class="bi bi-x"></i>
    </button>
  `;

  container.appendChild(notif);

  setTimeout(() => {
    if (notif.parentElement) {
      notif.classList.add('saliendo');
      setTimeout(() => {
        if (notif.parentElement) notif.remove();
      }, 300);
    }
  }, duracion);
}

function exito(mensaje) {
  mostrarNotificacion(mensaje, 'exito');
}

function error(mensaje) {
  mostrarNotificacion(mensaje, 'error');
}

function info(mensaje) {
  mostrarNotificacion(mensaje, 'info');
}

function advertencia(mensaje) {
  mostrarNotificacion(mensaje, 'advertencia');
}