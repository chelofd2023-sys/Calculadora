const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON y servir archivos estáticos desde public/
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Calcula el promedio ponderado de 14 sesiones.
 * Ponderación por sesión (Alineado a Canvas / USMP):
 * - Cognitivo / Pasito: 50% (0.50)
 * - Práctica / Mesa: 20% (0.20)
 * - Informe: 20% (0.20)
 * - Actitudinal: 10% (0.10)
 */
function calcularPromedioComponente(sesiones) {
  if (!sesiones || !Array.isArray(sesiones) || sesiones.length === 0) {
    return 0;
  }

  let sumaPromediosSesiones = 0;
  let sesionesEvaluadas = 0;

  sesiones.forEach(s => {
    // Verificar si al menos un campo de la sesión tiene nota
    if (s.pasito !== null || s.practicaMesa !== null || s.informe !== null || s.actitudinal !== null) {
      const pasito = s.pasito ?? 0;
      const practica = s.practicaMesa ?? 0;
      const informe = s.informe ?? 0;
      const actitudinal = s.actitudinal ?? 0;

      // Cálculo individual de la sesión
      const notaSesion = (pasito * 0.50) + (practica * 0.20) + (informe * 0.20) + (actitudinal * 0.10);

      sumaPromediosSesiones += notaSesion;
      sesionesEvaluadas++;
    }
  });

  // Retorna el promedio del componente sobre las sesiones ingresadas
  return sesionesEvaluadas > 0 ? (sumaPromediosSesiones / sesionesEvaluadas) : 0;
}

// Endpoint Principal: POST /api/calcular
app.post('/api/calcular', (req, res) => {
  try {
    const { examenParcial, examenFinal, seminarios, practicas } = req.body;

    // 1. Promedios por Componente Práctico
const promSeminarioNum = calcularPromedioComponente(seminarios);
const promLaboratorioNum = calcularPromedioComponente(practicas);

// Promedio Práctico según Sílabo: PP = PSem * 60% + PPra * 40%
const promPracticoNum = (promSeminarioNum * 0.60) + (promLaboratorioNum * 0.40);

    // 2. Promedio Teórico (Parcial 50% + Final 50%)
    const ep = examenParcial !== null && !isNaN(examenParcial) ? parseFloat(examenParcial) : 0;
    const ef = examenFinal !== null && !isNaN(examenFinal) ? parseFloat(examenFinal) : 0;
    
    // Si ninguno se ha ingresado, el teórico arranca en 0
    let promTeoricoNum = 0;
    if (examenParcial !== null && examenFinal !== null) {
      promTeoricoNum = (ep * 0.50) + (ef * 0.50);
    } else if (examenParcial !== null) {
      promTeoricoNum = ep * 0.50; // Teoría acumulada hasta el Parcial
    }

    // 3. Nota Final del Curso (Teoría 50% + Práctica 50%)
    const notaFinalNum = (promTeoricoNum * 0.50) + (promPracticoNum * 0.50);

    // 4. Validaciones de Aprobación (Puntaje mínimo aprobatorio = 11)
    const NOTA_MINIMA = 11;

    const apruebaTeoria = promTeoricoNum >= NOTA_MINIMA;
    const apruebaSeminario = promSeminarioNum >= NOTA_MINIMA;
    const apruebaLaboratorio = promLaboratorioNum >= NOTA_MINIMA;
    const apruebaCurso = notaFinalNum >= NOTA_MINIMA;

    // Cálculo de cuántos puntos faltan para llegar a 11 en cada rubro
    const faltanteTeoria = apruebaTeoria ? 0 : (NOTA_MINIMA - promTeoricoNum).toFixed(2);
    const faltanteSeminario = apruebaSeminario ? 0 : (NOTA_MINIMA - promSeminarioNum).toFixed(2);
    const faltanteLaboratorio = apruebaLaboratorio ? 0 : (NOTA_MINIMA - promLaboratorioNum).toFixed(2);

    // Respuesta formateada lista para el cliente
    return res.json({
      promedioTeorico: promTeoricoNum.toFixed(2),
      promedioSeminario: promSeminarioNum.toFixed(2),
      promedioLaboratorio: promLaboratorioNum.toFixed(2),
      promedioPractico: promPracticoNum.toFixed(2),
      notaFinalActual: notaFinalNum.toFixed(2),
      apruebaTeoria,
      faltanteTeoria,
      apruebaSeminario,
      faltanteSeminario,
      apruebaLaboratorio,
      faltanteLaboratorio,
      apruebaCurso
    });

  } catch (error) {
    console.error('Error en el backend al calcular:', error);
    return res.status(500).json({ error: 'Ocurrió un error interno al procesar las notas.' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor de Bioquímica corriendo en http://localhost:${PORT}`);
});