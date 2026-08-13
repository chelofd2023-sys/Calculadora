const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


function calcularPromedioComponente(sesiones) {
  if (!sesiones || !Array.isArray(sesiones) || sesiones.length === 0) {
    return 0;
  }

  let sumaPromediosSesiones = 0;
  let sesionesEvaluadas = 0;

  sesiones.forEach(s => {
    if (s.pasito !== null || s.practicaMesa !== null || s.informe !== null || s.actitudinal !== null) {
      const pasito = s.pasito ?? 0;
      const practica = s.practicaMesa ?? 0;
      const informe = s.informe ?? 0;
      const actitudinal = s.actitudinal ?? 0;

      const notaSesion = (pasito * 0.50) + (practica * 0.20) + (informe * 0.20) + (actitudinal * 0.10);

      sumaPromediosSesiones += notaSesion;
      sesionesEvaluadas++;
    }
  });

  return sesionesEvaluadas > 0 ? (sumaPromediosSesiones / sesionesEvaluadas) : 0;
}

app.post('/api/calcular', (req, res) => {
  try {
    const { examenParcial, examenFinal, seminarios, practicas } = req.body;

const promSeminarioNum = calcularPromedioComponente(seminarios);
const promLaboratorioNum = calcularPromedioComponente(practicas);

const promPracticoNum = (promSeminarioNum * 0.60) + (promLaboratorioNum * 0.40);

    const ep = examenParcial !== null && !isNaN(examenParcial) ? parseFloat(examenParcial) : 0;
    const ef = examenFinal !== null && !isNaN(examenFinal) ? parseFloat(examenFinal) : 0;
    
    let promTeoricoNum = 0;
    if (examenParcial !== null && examenFinal !== null) {
      promTeoricoNum = (ep * 0.50) + (ef * 0.50);
    } else if (examenParcial !== null) {
      promTeoricoNum = ep * 0.50; 
    }

    const notaFinalNum = (promTeoricoNum * 0.50) + (promPracticoNum * 0.50);

    const NOTA_MINIMA = 11;

    const apruebaTeoria = promTeoricoNum >= NOTA_MINIMA;
    const apruebaSeminario = promSeminarioNum >= NOTA_MINIMA;
    const apruebaLaboratorio = promLaboratorioNum >= NOTA_MINIMA;
    const apruebaCurso = notaFinalNum >= NOTA_MINIMA;

    const faltanteTeoria = apruebaTeoria ? 0 : (NOTA_MINIMA - promTeoricoNum).toFixed(2);
    const faltanteSeminario = apruebaSeminario ? 0 : (NOTA_MINIMA - promSeminarioNum).toFixed(2);
    const faltanteLaboratorio = apruebaLaboratorio ? 0 : (NOTA_MINIMA - promLaboratorioNum).toFixed(2);

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


app.listen(PORT, () => {
  console.log(`Servidor de Bioquímica corriendo en http://localhost:${PORT}`);
});
