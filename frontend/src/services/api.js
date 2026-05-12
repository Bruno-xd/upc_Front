const BASE_URL = "http://127.0.0.1:8000";

// =====================================
// UPLOAD EXCEL
// =====================================
export const uploadExcel = async (file) => {

  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(
    `${BASE_URL}/upload`,
    {
      method: "POST",
      body: formData
    }
  );

  return response.json();
};

// =====================================
// PREDICCIÓN NORMAL
// =====================================
export const predictFile = async (
  sessionId
) => {

  const response = await fetch(
    `${BASE_URL}/predict-file?session_id=${sessionId}`,
    {
      method: "POST"
    }
  );

  return response.json();
};

// =====================================
// PREDICCIÓN FUTURA
// =====================================
export const predictFuture = async (
  sessionId,
  semanas = 4
) => {

  const response = await fetch(
    `${BASE_URL}/predict-future?session_id=${sessionId}&semanas=${semanas}`,
    {
      method: "POST"
    }
  );

  return response.json();
};

// =====================================
// PROVINCIAS
// =====================================
export const getProvinces = async (
  sessionId
) => {

  const response = await fetch(
    `${BASE_URL}/provinces?session_id=${sessionId}`
  );

  return response.json();
};

// =====================================
// DISTRITOS
// =====================================
export const getDistricts = async (
  sessionId,
  provincia
) => {

  const response = await fetch(
    `${BASE_URL}/districts?session_id=${sessionId}&provincia=${provincia}`
  );

  return response.json();
};

// =====================================
// PREDICCIÓN POR DISTRITO
// =====================================
export const predictByDistrict = async (
  sessionId,
  distrito,
  semanas = 4
) => {

  const response = await fetch(
    `${BASE_URL}/predict-by-district?session_id=${sessionId}&distrito=${distrito}&semanas=${semanas}`,
    {
      method: "POST"
    }
  );

  return response.json();
};

// =====================================
// PREDICCIÓN POR PROVINCIA
// =====================================
export const predictByProvince = async (
  sessionId,
  provincia,
  semanas = 4
) => {

  const response = await fetch(
    `${BASE_URL}/predict-by-province?session_id=${sessionId}&provincia=${provincia}&semanas=${semanas}`,
    {
      method: "POST"
    }
  );

  return response.json();
};

// =====================================
// TOP DISTRITOS
// =====================================
export const topDistricts = async (
  sessionId
) => {

  const response = await fetch(
    `${BASE_URL}/top-districts?session_id=${sessionId}`,
    {
      method: "POST"
    }
  );

  return response.json();
};