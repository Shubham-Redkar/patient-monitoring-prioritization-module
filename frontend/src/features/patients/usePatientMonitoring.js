import { useCallback, useEffect, useRef, useState } from "react";
import { patientApi } from "../../api/client";
import { HISTORY_HOURS, POLL_INTERVAL_MS, PREDICTION_DEBOUNCE_MS } from "../../config/app";

export function usePatientMonitoring(patientId, token) {
  const [hour, setHour] = useState(0);
  const [history, setHistory] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const hourRef = useRef(0);
  const debounceRef = useRef();

  const loadPrediction = useCallback(async (selectedHour = hourRef.current) => {
    try {
      setPrediction(await patientApi.prediction(token, patientId, selectedHour));
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }, [patientId, token]);

  const loadHistory = useCallback(async () => {
    try { setHistory(await patientApi.history(token, patientId, HISTORY_HOURS)); }
    catch (requestError) { setError(requestError.message); }
  }, [patientId, token]);

  const loadMeta = useCallback(async () => {
    try { setMeta((await patientApi.meta(token, patientId)).manual_override || null); }
    catch (requestError) { setError(requestError.message); }
  }, [patientId, token]);

  const refresh = useCallback(async () => {
    await Promise.all([loadPrediction(), loadHistory(), loadMeta()]);
    setUpdatedAt(new Date());
  }, [loadPrediction, loadHistory, loadMeta]);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const selectHour = (value) => {
    const selected = Number(value);
    hourRef.current = selected;
    setHour(selected);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadPrediction(selected), PREDICTION_DEBOUNCE_MS);
  };

  return { hour, selectHour, history, prediction, meta, loading, error, updatedAt, refresh, loadMeta, loadPrediction };
}
