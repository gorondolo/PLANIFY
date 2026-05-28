import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Middlewares
app.use(cors());
app.use(express.json());

// Servir archivos estáticos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../frontend')));

// ===== AUTENTICACIÓN =====

// SIGNUP
app.post('/api/signup', async (req, res) => {
  const { nombre, email, password, avatar } = req.body;

  if (!nombre || !email || !password) {
    return res.json({ error: 'Faltan campos requeridos' });
  }

  try {
    // Verificar si el email ya existe
    const { data: usuarioExistente } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .single();

    if (usuarioExistente) {
      return res.json({ error: 'El email ya está registrado' });
    }

    // Insertar nuevo usuario
    const { data, error } = await supabase
      .from('usuarios')
      .insert([
        {
          nombre,
          email,
          password,
          avatar: avatar || 'bi-person-circle',
          fecha_registro: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Error Supabase:', error);
      return res.json({ error: 'Error al crear la cuenta' });
    }

    res.json({ 
      success: true, 
      mensaje: 'Cuenta creada exitosamente',
      usuario_id: data[0].id
    });
  } catch (err) {
    console.error('Error:', err);
    res.json({ error: 'Error de servidor' });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ error: 'Email y contraseña requeridos' });
  }

  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, avatar')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (error || !data) {
      return res.json({ error: 'Email o contraseña incorrectos' });
    }

    res.json({
      success: true,
      usuario_id: data.id,
      usuario_nombre: data.nombre,
      usuario_email: data.email,
      usuario_avatar: data.avatar
    });
  } catch (err) {
    console.error('Error:', err);
    res.json({ error: 'Error de servidor' });
  }
});

// ===== TAREAS =====

// GET tareas por usuario
app.get('/api/tareas/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params;

  try {
    const { data, error } = await supabase
      .from('tareas')
      .select(`
        id,
        usuario_id,
        materia_id,
        titulo,
        descripcion,
        fecha_entrega,
        prioridad,
        completada,
        fecha_creacion,
        materias(id, nombre, color)
      `)
      .eq('usuario_id', usuario_id)
      .order('fecha_entrega', { ascending: true });

    if (error) {
      console.error('Error Supabase:', error);
      return res.json({ error: 'Error al obtener tareas' });
    }

    res.json({ tareas: data || [] });
  } catch (err) {
    console.error('Error:', err);
    res.json({ error: 'Error de servidor' });
  }
});

// POST nueva tarea
app.post('/api/tareas', async (req, res) => {
  const { usuario_id, materia_id, titulo, descripcion, fecha_entrega, prioridad } = req.body;

  if (!usuario_id || !titulo) {
    return res.json({ error: 'Faltan campos requeridos' });
  }

  try {
    const { data, error } = await supabase
      .from('tareas')
      .insert([
        {
          usuario_id,
          materia_id: materia_id || null,
          titulo,
          descripcion,
          fecha_entrega: fecha_entrega || null,
          prioridad: prioridad || 'media',
          completada: false,
          fecha_creacion: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Error Supabase:', error);
      return res.json({ error: 'Error al crear tarea' });
    }

    res.json({ success: true, tarea: data[0] });
  } catch (err) {
    console.error('Error:', err);
    res.json({ error: 'Error de servidor' });
  }
});

// PUT actualizar tarea
app.put('/api/tareas/:id', async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, fecha_entrega, prioridad, completada } = req.body;

  try {
    const actualizacion = {};
    if (titulo !== undefined) actualizacion.titulo = titulo;
    if (descripcion !== undefined) actualizacion.descripcion = descripcion;
    if (fecha_entrega !== undefined) actualizacion.fecha_entrega = fecha_entrega;
    if (prioridad !== undefined) actualizacion.prioridad = prioridad;
    if (completada !== undefined) actualizacion.completada = completada;

    const { data, error } = await supabase
      .from('tareas')
      .update(actualizacion)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error Supabase:', error);
      return res.json({ error: 'Error al actualizar tarea' });
    }

    res.json({ success: true, tarea: data[0] });
  } catch (err) {
    console.error('Error:', err);
    res.json({ error: 'Error de servidor' });
  }
});

// DELETE tarea
app.delete('/api/tareas/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('tareas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error Supabase:', error);
      return res.json({ error: 'Error al eliminar tarea' });
    }

    res.json({ success: true, mensaje: 'Tarea eliminada' });
  } catch (err) {
    console.error('Error:', err);
    res.json({ error: 'Error de servidor' });
  }
});

// ===== MATERIAS =====

// GET materias por usuario
app.get('/api/materias/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params;

  try {
    const { data, error } = await supabase
      .from('materias')
      .select('*')
      .eq('usuario_id', usuario_id)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error Supabase:', error);
      return res.json({ error: 'Error al obtener materias' });
    }

    res.json({ materias: data || [] });
  } catch (err) {
    console.error('Error:', err);
    res.json({ error: 'Error de servidor' });
  }
});

// POST nueva materia
app.post('/api/materias', async (req, res) => {
  const { usuario_id, nombre, profesor, color, horario } = req.body;

  if (!usuario_id || !nombre) {
    return res.json({ error: 'Faltan campos requeridos' });
  }

  try {
    const { data, error } = await supabase
      .from('materias')
      .insert([
        {
          usuario_id,
          nombre,
          profesor: profesor || null,
          color: color || '#4A90D9',
          horario: horario || null
        }
      ])
      .select();

    if (error) {
      console.error('Error Supabase:', error);
      return res.json({ error: 'Error al crear materia' });
    }

    res.json({ success: true, materia: data[0] });
  } catch (err) {
    console.error('Error:', err);
    res.json({ error: 'Error de servidor' });
  }
});

// PUT actualizar materia
app.put('/api/materias/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, profesor, color, horario } = req.body;

  try {
    const actualizacion = {};
    if (nombre !== undefined) actualizacion.nombre = nombre;
    if (profesor !== undefined) actualizacion.profesor = profesor;
    if (color !== undefined) actualizacion.color = color;
    if (horario !== undefined) actualizacion.horario = horario;

    const { data, error } = await supabase
      .from('materias')
      .update(actualizacion)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error Supabase:', error);
      return res.json({ error: 'Error al actualizar materia' });
    }

    res.json({ success: true, materia: data[0] });
  } catch (err) {
    console.error('Error:', err);
    res.json({ error: 'Error de servidor' });
  }
});

// DELETE materia
app.delete('/api/materias/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('materias')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error Supabase:', error);
      return res.json({ error: 'Error al eliminar materia' });
    }

    res.json({ success: true, mensaje: 'Materia eliminada' });
  } catch (err) {
    console.error('Error:', err);
    res.json({ error: 'Error de servidor' });
  }
});

// Servir index.html para rutas no encontradas
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});