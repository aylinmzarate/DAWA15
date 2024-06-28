const mysql = require('mysql');
const express = require('express');
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');

const app = express();
const port = 3000;

// Configuración de la aplicación Express
app.set('view engine', 'pug');
app.set('views', './views');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Configuración de la conexión a MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'laboratorio15'
});

// Conexión a la base de datos MySQL
connection.connect((error) => {
  if (error) {
    console.error('Error al conectar a MySQL:', error);
    return;
  }
  console.log('Conexión exitosa a MySQL');
});

// Rutas y operaciones CRUD para Alumnos y Cursos
app.get('/', (req, res) => {
  // Obtener todos los alumnos y cursos
  connection.query('SELECT * FROM alumnos', (errorAlumnos, resultadosAlumnos) => {
    if (errorAlumnos) {
      console.error('Error al obtener los datos de alumnos:', errorAlumnos);
      return res.status(500).send('Error interno al obtener datos de alumnos');
    }
    
    connection.query('SELECT * FROM cursos', (errorCursos, resultadosCursos) => {
      if (errorCursos) {
        console.error('Error al obtener los datos de cursos:', errorCursos);
        return res.status(500).send('Error interno al obtener datos de cursos');
      }
      
      res.render('index', { alumnos: resultadosAlumnos, cursos: resultadosCursos });
    });
  });
});

// Agregar nuevo alumno y matricularlo en cursos seleccionados
app.post('/add-alumno', [
  body('nombre').isString().notEmpty().withMessage('El nombre es obligatorio'),
  body('edad').isInt({ min: 1 }).withMessage('La edad debe ser un número entero positivo'),
  body('email').isEmail().withMessage('Debe ser un correo electrónico válido'),
  body('cursos').isArray().withMessage('Debe seleccionar al menos un curso')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { nombre, edad, email, cursos } = req.body;
  
  // Insertar alumno en la tabla alumnos
  const consultaAlumno = 'INSERT INTO alumnos (nombre, edad, email) VALUES (?, ?, ?)';
  connection.query(consultaAlumno, [nombre, edad, email], (errorAlumno, resultsAlumno) => {
    if (errorAlumno) {
      console.error('Error al insertar datos del alumno:', errorAlumno);
      return res.status(500).send('Error interno al insertar datos del alumno');
    }
    
    const id_alumno = resultsAlumno.insertId; // Obtener el ID del nuevo alumno insertado
    
    // Crear arreglo de valores para insertar en alumnos_cursos
    const valoresAlumnoCurso = cursos.map(cursoId => [id_alumno, cursoId]);
    
    // Insertar relación en la tabla alumnos_cursos por cada curso seleccionado
    const consultaAlumnoCurso = 'INSERT INTO alumnos_cursos (id_alumno, id_curso) VALUES ?';
    connection.query(consultaAlumnoCurso, [valoresAlumnoCurso], (errorAlumnoCurso, resultsAlumnoCurso) => {
      if (errorAlumnoCurso) {
        console.error('Error al insertar relación alumno-curso:', errorAlumnoCurso);
        return res.status(500).send('Error interno al insertar relación alumno-curso');
      }
      
      console.log('Alumno insertado y matriculado en curso(s) exitosamente');
      res.redirect('/');
    });
  });
});

// Ruta para actualizar datos del alumno
app.post('/update-alumno', [
  body('nombre').isString().notEmpty().withMessage('El nombre es obligatorio'),
  body('edad').isInt({ min: 1 }).withMessage('La edad debe ser un número entero positivo'),
  body('email').isEmail().withMessage('Debe ser un correo electrónico válido')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { id, nombre, edad, email } = req.body;
  
  // Actualizar datos del alumno en la tabla alumnos
  const consultaUpdateAlumno = 'UPDATE alumnos SET nombre = ?, edad = ?, email = ? WHERE id = ?';
  connection.query(consultaUpdateAlumno, [nombre, edad, email, id], (errorUpdateAlumno, resultsUpdateAlumno) => {
    if (errorUpdateAlumno) {
      console.error('Error al actualizar datos del alumno:', errorUpdateAlumno);
      return res.status(500).send('Error interno al actualizar datos del alumno');
    }
    
    console.log('Datos del alumno actualizados exitosamente');
    res.redirect('/');
  });
});

// Ruta para eliminar alumno
app.post('/delete-alumno', (req, res) => {
  const { id } = req.body;
  
  // Eliminar alumno de la tabla alumnos
  const consultaDeleteAlumno = 'DELETE FROM alumnos WHERE id = ?';
  connection.query(consultaDeleteAlumno, [id], (errorDeleteAlumno, resultsDeleteAlumno) => {
    if (errorDeleteAlumno) {
      console.error('Error al eliminar datos del alumno:', errorDeleteAlumno);
      return res.status(500).send('Error interno al eliminar datos del alumno');
    }
    
    console.log('Alumno eliminado exitosamente');
    res.redirect('/');
  });
});

// Ruta para agregar nuevo curso
app.post('/add-curso', [
  body('nombre').isString().notEmpty().withMessage('El nombre es obligatorio'),
  body('descripcion').isString().notEmpty().withMessage('La descripción es obligatoria')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { nombre, descripcion } = req.body;
  
  // Insertar curso en la tabla cursos
  const consultaCurso = 'INSERT INTO cursos (nombre, descripcion) VALUES (?, ?)';
  connection.query(consultaCurso, [nombre, descripcion], (errorCurso, resultsCurso) => {
    if (errorCurso) {
      console.error('Error al insertar datos del curso:', errorCurso);
      return res.status(500).send('Error interno al insertar datos del curso');
    }
    
    console.log('Curso insertado exitosamente');
    res.redirect('/');
  });
});

// Ruta para actualizar datos del curso
app.post('/update-curso', [
  body('nombre').isString().notEmpty().withMessage('El nombre es obligatorio'),
  body('descripcion').isString().notEmpty().withMessage('La descripción es obligatoria')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { id, nombre, descripcion } = req.body;
  
  // Actualizar datos del curso en la tabla cursos
  const consultaUpdateCurso = 'UPDATE cursos SET nombre = ?, descripcion = ? WHERE id = ?';
  connection.query(consultaUpdateCurso, [nombre, descripcion, id], (errorUpdateCurso, resultsUpdateCurso) => {
    if (errorUpdateCurso) {
      console.error('Error al actualizar datos del curso:', errorUpdateCurso);
      return res.status(500).send('Error interno al actualizar datos del curso');
    }
    
    console.log('Datos del curso actualizados exitosamente');
    res.redirect('/');
  });
});

// Ruta para eliminar curso
app.post('/delete-curso', (req, res) => {
  const { id } = req.body;
  
  // Eliminar curso de la tabla cursos
  const consultaDeleteCurso = 'DELETE FROM cursos WHERE id = ?';
  connection.query(consultaDeleteCurso, [id], (errorDeleteCurso, resultsDeleteCurso) => {
    if (errorDeleteCurso) {
      console.error('Error al eliminar datos del curso:', errorDeleteCurso);
      return res.status(500).send('Error interno al eliminar datos del curso');
    }
    
    console.log('Curso eliminado exitosamente');
    res.redirect('/');
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor en ejecución en http://localhost:${port}`);
});
