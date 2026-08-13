document.addEventListener('DOMContentLoaded', () => {
  const seminariosContainer = document.getElementById('seminarios-container');
  const practicasContainer = document.getElementById('practicas-container');
  const gradeForm = document.getElementById('grade-form');
  const TOTAL_SESIONES = 14;

  const crearFilaSesion = (prefijo, i) => {
    const row = document.createElement('div');
    row.className = 'session-row';
    row.innerHTML = `
      <div class="session-label">Sesión ${i}</div>
      <div class="form-group-sub">
        <label>Cognitivo:</label>
        <input type="number" id="${prefijo}-pas-${i}" class="auto-save nav-input" min="0" max="20" step="0.1" placeholder="0-20">
      </div>
      <div class="form-group-sub">
        <label>Práctica:</label>
        <input type="number" id="${prefijo}-prac-${i}" class="auto-save nav-input" min="0" max="20" step="0.1" placeholder="0-20">
      </div>
      <div class="form-group-sub">
        <label>Informe:</label>
        <input type="number" id="${prefijo}-inf-${i}" class="auto-save nav-input" min="0" max="20" step="0.1" placeholder="0-20">
      </div>
      <div class="form-group-sub">
        <label>Actitudinal:</label>
        <input type="number" id="${prefijo}-act-${i}" class="auto-save nav-input" min="0" max="20" step="0.1" placeholder="0-20">
      </div>
    `;
    return row;
  };

  if (seminariosContainer && practicasContainer) {
    for (let i = 1; i <= TOTAL_SESIONES; i++) {
      seminariosContainer.appendChild(crearFilaSesion('sem', i));
      practicasContainer.appendChild(crearFilaSesion('prac', i));
    }
  }

  const obtenerSesiones = (prefijo) => {
    const sesiones = [];
    for (let i = 1; i <= TOTAL_SESIONES; i++) {
      const getVal = (id) => {
        const el = document.getElementById(id);
        if (!el || el.value === '' || isNaN(el.value)) return null;
        let val = parseFloat(el.value);
        if (val > 20) val = 20;
        if (val < 0) val = 0;
        return val;
      };

      sesiones.push({
        pasito: getVal(`${prefijo}-pas-${i}`),
        practicaMesa: getVal(`${prefijo}-prac-${i}`),
        informe: getVal(`${prefijo}-inf-${i}`),
        actitudinal: getVal(`${prefijo}-act-${i}`)
      });
    }
    return sesiones;
  };

  const calcularPromedioLocal = (sesiones) => {
    let suma = 0;
    let contadas = 0;

    sesiones.forEach(s => {
      if (s.pasito !== null || s.practicaMesa !== null || s.informe !== null || s.actitudinal !== null) {
        const p = s.pasito ?? 0;
        const pr = s.practicaMesa ?? 0;
        const inf = s.informe ?? 0;
        const a = s.actitudinal ?? 0;

        suma += (p * 0.50) + (pr * 0.20) + (inf * 0.20) + (a * 0.10);
        contadas++;
      }
    });

    return contadas > 0 ? (suma / contadas).toFixed(2) : '0.00';
  };

  const actualizarPromediosDirectos = () => {
    const semData = obtenerSesiones('sem');
    const pracData = obtenerSesiones('prac');

    const promSem = calcularPromedioLocal(semData);
    const promPrac = calcularPromedioLocal(pracData);

    const elemSem = document.getElementById('inline-prom-seminario');
    const elemPrac = document.getElementById('inline-prom-laboratorio');

    if (elemSem) elemSem.textContent = promSem;
    if (elemPrac) elemPrac.textContent = promPrac;
  };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
      e.preventDefault();
      const inputs = Array.from(document.querySelectorAll('#examenParcial, #examenFinal, .nav-input'));
      const currentIndex = inputs.indexOf(e.target);

      if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
        const nextInput = inputs[currentIndex + 1];
        nextInput.focus();
        nextInput.select();
      } else {
        gradeForm.requestSubmit();
      }
    }
  });

  const guardarNotasEnStorage = () => {
    const dataGuardar = {};
    document.querySelectorAll('.auto-save').forEach(input => {
      dataGuardar[input.id] = input.value;
    });
    localStorage.setItem('notas_bioquimica_4criterios_full', JSON.stringify(dataGuardar));
  };

  const cargarNotasDeStorage = () => {
    const data = JSON.parse(localStorage.getItem('notas_bioquimica_4criterios_full'));
    if (data) {
      Object.keys(data).forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = data[id];
      });
    }
    actualizarPromediosDirectos();
  };

  document.addEventListener('input', (e) => {
    if (e.target.classList.contains('auto-save')) {
      guardarNotasEnStorage();
      actualizarPromediosDirectos();
    }
  });

  cargarNotasDeStorage();

  gradeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const epVal = document.getElementById('examenParcial').value;
    const efVal = document.getElementById('examenFinal').value;

    const payload = {
      examenParcial: epVal !== '' ? parseFloat(epVal) : null,
      examenFinal: efVal !== '' ? parseFloat(efVal) : null,
      seminarios: obtenerSesiones('sem'),
      practicas: obtenerSesiones('prac')
    };

    try {
      const response = await fetch('/api/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      document.getElementById('inline-prom-seminario').textContent = data.promedioSeminario;
      document.getElementById('inline-prom-laboratorio').textContent = data.promedioLaboratorio;

      document.getElementById('res-teoria').textContent = data.promedioTeorico;
      document.getElementById('res-seminario').textContent = data.promedioSeminario;
      document.getElementById('res-laboratorio').textContent = data.promedioLaboratorio;
      document.getElementById('res-practico').textContent = data.promedioPractico;
      document.getElementById('res-final').textContent = data.notaFinalActual;

      const renderStatus = (elementId, aprueba, faltante) => {
        const el = document.getElementById(elementId);
        if (aprueba) {
          el.textContent = '✓ Aprobado (≥ 11)';
          el.style.color = 'var(--success-color)';
        } else {
          el.textContent = `Faltan: ${faltante} pts`;
          el.style.color = 'var(--warning-color)';
        }
      };

      renderStatus('status-teoria', data.apruebaTeoria, data.faltanteTeoria);
      renderStatus('status-seminario', data.apruebaSeminario, data.faltanteSeminario);
      renderStatus('status-laboratorio', data.apruebaLaboratorio, data.faltanteLaboratorio);

      const resEstado = document.getElementById('res-estado');
      if (data.apruebaCurso) {
        resEstado.textContent = 'APROBADO';
        resEstado.style.color = 'var(--success-color)';
      } else {
        resEstado.textContent = 'REQUIERE MÁS NOTA';
        resEstado.style.color = 'var(--warning-color)';
      }

    } catch (error) {
      console.error('Error al comunicarse con la API:', error);
    }
  });
});
