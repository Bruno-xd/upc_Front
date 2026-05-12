import React, { useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
function App() {
  const [file, setFile] = useState(null);
  const [sessionId, setSessionId] = useState("");
  const [resultado, setResultado] = useState([]);
  const [futureResult, setFutureResult] = useState([]);
  const [topDistritos, setTopDistritos] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [distritos, setDistritos] = useState([]);
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState("");
  const [distritoSeleccionado, setDistritoSeleccionado] = useState("");
  const [loading, setLoading] = useState(false);
  // ========================================
  // SUBIR ARCHIVO
  // ========================================
  const uploadFile = async () => {
    if (!file) {
      alert("Selecciona un archivo Excel primero");
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      const response = await axios.post(
        "http://127.0.0.1:8000/upload",
        formData
      );
      setSessionId(response.data.session_id);
      alert("Archivo cargado correctamente");
      obtenerProvincias(
        response.data.session_id
      );
    } catch (error) {
      console.error(error);
      alert("Error subiendo archivo");
    } finally {
      setLoading(false);
    }
  };
  // ========================================
  // OBTENER PROVINCIAS
  // ========================================
  const obtenerProvincias = async (sid) => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/provinces?session_id=${sid}`
      );
      setProvincias(response.data);
    } catch (error) {
      console.error(error);
    }
  };
  // ========================================
  // OBTENER DISTRITOS
  // ========================================
  const obtenerDistritos = async (provincia) => {
    setProvinciaSeleccionada(provincia);
    setDistritoSeleccionado("");
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/districts`,
        {
          params: {
            session_id: sessionId,
            provincia: provincia
          }
        }
      );
      setDistritos(response.data);
    } catch (error) {
      console.error(error);
    }
  };
  // ========================================
  // LIMPIAR TABLAS
  // ========================================
  const limpiarTablas = () => {
    setResultado([]);
    setFutureResult([]);
    setTopDistritos([]);
  };
  // ========================================
  // VALIDAR SESSION
  // ========================================
  const validarSession = () => {
    if (!sessionId) {
      alert("Primero debes subir un archivo Excel");
      return false;
    }
    return true;
  };
  // ========================================
  // EVALUAR MODELO
  // ========================================
  const evaluarModelo = async () => {
    if (!validarSession()) return;
    try {
      limpiarTablas();
      setLoading(true);
      const response = await axios.post(
        "http://127.0.0.1:8000/predict-file",
        null,
        {
          params: {
            session_id: sessionId
          }
        }
      );
      let data = response.data.predicciones;
      if (provinciaSeleccionada !== "") {
        data = data.filter(
          x =>
            x.provincia?.toUpperCase()
            ===
            provinciaSeleccionada.toUpperCase()
        );
      }
      if (distritoSeleccionado !== "") {
        data = data.filter(
          x =>
            x.distrito?.toUpperCase()
            ===
            distritoSeleccionado.toUpperCase()
        );
      }
      setResultado(data);
    } catch (error) {
      console.error(error);
      alert("Error evaluando modelo");
    } finally {
      setLoading(false);
    }
  };
  // ========================================
  // PREDECIR FUTURO
  // ========================================
  const predecirFuturo = async () => {
    if (!validarSession()) return;
    try {
      limpiarTablas();
      setLoading(true);
      let endpoint = "predict-future";
      let params = {
        session_id: sessionId,
        semanas: 4
      };
      if (distritoSeleccionado !== "") {
        endpoint = "predict-by-district";
        params.distrito = distritoSeleccionado;
      }
      else if (provinciaSeleccionada !== "") {
        endpoint = "predict-by-province";
        params.provincia = provinciaSeleccionada;
      }
      const response = await axios.post(
        `http://127.0.0.1:8000/${endpoint}`,
        null,
        {
          params
        }
      );
      const data =
        response.data.predicciones_futuras
        || response.data;
      setFutureResult(data);
    } catch (error) {
      console.error(error);
      alert("Error generando predicción futura");
    } finally {
      setLoading(false);
    }
  };
  // ========================================
  // TOP DISTRITOS
  // ========================================
  const obtenerTopDistritos = async () => {
    if (!validarSession()) return;
    try {
      limpiarTablas();
      setLoading(true);
      const response = await axios.post(
        "http://127.0.0.1:8000/top-districts",
        null,
        {
          params: {
            session_id: sessionId
          }
        }
      );
      setTopDistritos(response.data);
    } catch (error) {
      console.error(error);
      alert("Error obteniendo top distritos");
    } finally {
      setLoading(false);
    }
  };
  // ========================================
// NIVEL DE RIESGO
// ========================================
const obtenerRiesgo = (valor) => {

  if (valor >= 50) {
    return {
      texto: "ALTO",
      color: "danger"
    };
  }

  if (valor >= 20) {
    return {
      texto: "MEDIO",
      color: "warning"
    };
  }

  return {
    texto: "BAJO",
    color: "success"
  };
};
const obtenerTotalCasos = () => {

  const data =
    futureResult.length > 0
      ? futureResult
      : topDistritos;

  if (data.length === 0) return 0;

  return data
    .reduce(
      (acc, item) =>
        acc + Number(item.prediccion || 0),
      0
    )
    .toFixed(0);
};
const obtenerRiesgoGeneral = () => {

  const data =
    futureResult.length > 0
      ? futureResult
      : topDistritos;

  if (data.length === 0) {
    return {
      texto: "SIN DATOS",
      color: "secondary"
    };
  }

  const promedio =
    data.reduce(
      (acc, item) =>
        acc + Number(item.prediccion || 0),
      0
    ) / data.length;

  return obtenerRiesgo(promedio);
};
const obtenerTendencia = () => {

  if (futureResult.length < 2) {
    return "Sin tendencia";
  }

  const primero =
    futureResult[0].prediccion;

  const ultimo =
    futureResult[
      futureResult.length - 1
    ].prediccion;

  if (ultimo > primero) {
    return "↑ En aumento";
  }

  if (ultimo < primero) {
    return "↓ Disminuyendo";
  }

  return "→ Estable";
};
  return (
    <div className="main-container">
      <div className="hero-section">
        <h1>
          Sistema Inteligente de Predicción de Dengue
        </h1>
        <p>
          Predicción epidemiológica utilizando Machine Learning y XGBoost
        </p>
      </div>
      <div className="container pb-5">
        {/* SUBIR ARCHIVO */}
        <div className="custom-card">
          <div className="section-title">
            1. Cargar Dataset
          </div>
          <input
            type="file"
            className="form-control mb-3"
            onChange={(e) =>
              setFile(e.target.files[0])
            }
          />
          <button
            className="btn btn-primary custom-btn"
            onClick={uploadFile}
          >
            Subir archivo Excel
          </button>
          {
            sessionId && (
              <div className="success-box mt-3">
                Archivo cargado correctamente
              </div>
            )
          }
        </div>
        {/* FILTROS */}
        <div className="custom-card">
          <div className="section-title">
            2. Filtros Geográficos
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold">
                Provincia
              </label>
              <select
                className="form-select"
                value={provinciaSeleccionada}
                onChange={(e) =>
                  obtenerDistritos(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Todas las provincias
                </option>
                {
                  provincias.map((prov, i) => (
                    <option
                      key={i}
                      value={prov}
                    >
                      {prov}
                    </option>
                  ))
                }
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold">
                Distrito
              </label>
              <select
                className="form-select"
                value={distritoSeleccionado}
                onChange={(e) =>
                  setDistritoSeleccionado(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Todos los distritos
                </option>
                {
                  distritos.map((dist, i) => (
                    <option
                      key={i}
                      value={dist}
                    >
                      {dist}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>
        </div>
        {/* EVALUAR MODELO */}
        <div className="custom-card evaluate-card">
          <div className="section-title">
            3. Evaluar Modelo
          </div>
          <p>
            Compara los casos reales históricos con las predicciones generadas
            por el modelo.
          </p>
          <button
            className="btn btn-success custom-btn"
            onClick={evaluarModelo}
          >
            Evaluar rendimiento
          </button>
        </div>
        {/* PREDICCIÓN FUTURA */}
        <div className="custom-card predict-card">
          <div className="section-title">
            4. Predicción Futura
          </div>
          <p>
            Genera predicciones epidemiológicas para semanas futuras.
          </p>
          <div className="row align-items-end">
            <div className="col-md-4 mb-3">
              <button
                className="btn btn-warning custom-btn text-dark"
                onClick={predecirFuturo}
              >
                Generar predicción
              </button>
            </div>
          </div>
        </div>
        {/* TOP DISTRITOS */}
        <div className="custom-card danger-card">
          <div className="section-title">
            5. Distritos con Mayor Riesgo
          </div>
          <p>
            Muestra los distritos con mayor número de casos predichos.
          </p>
          <button
            className="btn btn-danger custom-btn"
            onClick={obtenerTopDistritos}
          >
            Ver distritos críticos
          </button>
        </div>
        {/* LOADING */}
        {
          loading && (
            <div className="loading-box">
              Procesando información...
            </div>
          )
        }
        {
  (
    futureResult.length > 0 ||
    topDistritos.length > 0
  ) && (

    <div className="row mb-4">

      {/* CASOS ESTIMADOS */}
      <div className="col-md-4 mb-3">
        <div className="kpi-card">
          <h5>
            Casos estimados
          </h5>

          <h2>
            {
              obtenerTotalCasos()
            }
          </h2>

          <small>
            Total proyectado
          </small>
        </div>
      </div>

      {/* RIESGO GENERAL */}
      <div className="col-md-4 mb-3">
        <div className="kpi-card">

          <h5>
            Riesgo general
          </h5>

          <h2>
            <span
              className={`badge bg-${
                obtenerRiesgoGeneral().color
              }`}
            >
              {
                obtenerRiesgoGeneral().texto
              }
            </span>
          </h2>

          <small>
            Nivel epidemiológico
          </small>

        </div>
      </div>

      {/* TENDENCIA */}
      <div className="col-md-4 mb-3">
        <div className="kpi-card">

          <h5>
            Tendencia
          </h5>

          <h2>
            {
              obtenerTendencia()
            }
          </h2>

          <small>
            Comportamiento semanal
          </small>

        </div>
      </div>

    </div>
  )
}
        {/* TABLA EVALUACIÓN */}
        {
          resultado.length > 0 && (
            <div className="table-card">
              <h3>
                Resultados de Evaluación
              </h3>
              <div className="table-responsive">
                <table className="table table-hover table-bordered">
                  <thead className="table-dark">
                    <tr>
                      <th>Provincia</th>
                      <th>Distrito</th>
                      <th>Año</th>
                      <th>Semana</th>
                      <th>Casos Reales</th>
                      <th>Predicción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      resultado.map((item, i) => (
                        <tr key={i}>
                          <td>{item.provincia}</td>
                          <td>{item.distrito}</td>
                          <td>{item.ano}</td>
                          <td>{item.semana}</td>
                          <td>{item.casos_reales}</td>
                          <td>{item.prediccion}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )
        }
        {
  futureResult.length > 0 &&
  (
    provinciaSeleccionada !== "" ||
    distritoSeleccionado !== ""
  ) && (
    <div className="table-card">
      <h3>
        Tendencia de Casos Predichos
      </h3>

      <p className="text-muted">
        Visualización del comportamiento estimado de casos de dengue por semana.
      </p>

      <ResponsiveContainer
        width="100%"
        height={350}
      >
        <LineChart
          data={futureResult}
          margin={{
            top: 20,
            right: 30,
            left: 0,
            bottom: 10
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="semana"
          />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="prediccion"
            stroke="#dc3545"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
        {/* TABLA FUTURA */}
        {
          futureResult.length > 0 && (
            <div className="table-card">
              <h3>
                Predicciones Futuras
              </h3>
              <div className="table-responsive">
                <table className="table table-hover table-bordered">
                  <thead className="table-warning">
                    <tr>
                      <th>Provincia</th>
                      <th>Distrito</th>
                      <th>Año</th>
                      <th>Semana</th>
                      <th>Predicción</th>
                      <th>Riesgo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      futureResult.map((item, i) => (
                        <tr key={i}>
                          <td>{item.provincia}</td>
                          <td>{item.distrito}</td>
                          <td>{item.ano}</td>
                          <td>{item.semana}</td>
                          <td>{item.prediccion}</td>
                          <td>
  <span
    className={`badge bg-${
      obtenerRiesgo(
        item.prediccion
      ).color
    }`}
  >
    {
      obtenerRiesgo(
        item.prediccion
      ).texto
    }
  </span>
</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )
        }
        {/* TOP DISTRITOS */}
        {
          topDistritos.length > 0 && (
            <div className="table-card">
              <h3>
                Distritos con Mayor Riesgo Epidemiológico
              </h3>
              <div className="table-responsive">
                <table className="table table-hover table-bordered">
                  <thead className="table-danger">
                    <tr>
                      <th>Provincia</th>
                      <th>Distrito</th>
                      <th>Año</th>
                      <th>Semana</th>
                      <th>Predicción</th>
                      <th>Riesgo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      topDistritos.map((item, i) => (
                        <tr key={i}>
                          <td>{item.provincia}</td>
                          <td>{item.distrito}</td>
                          <td>{item.ano}</td>
                          <td>{item.semana}</td>
                          <td>{item.prediccion}</td>
                          <td>
  <span
    className={`badge bg-${
      obtenerRiesgo(
        item.prediccion
      ).color
    }`}
  >
    {
      obtenerRiesgo(
        item.prediccion
      ).texto
    }
  </span>
</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )
        }
      </div>
    </div>
  );
}
export default App;