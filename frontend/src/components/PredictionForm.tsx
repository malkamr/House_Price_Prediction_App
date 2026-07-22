import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchLocations, predictPrice } from "../api/predictionClient";
import type { PredictionRequest } from "../types/prediction";

const FURNISHING_OPTS = ["Furnished", "Semi-Furnished", "Unfurnished"];
const TRANSACTION_OPTS = ["New Property", "Resale"];
const OWNERSHIP_OPTS = ["Freehold", "Leasehold", "Co-operative Society"];
const FACING_OPTS = ["East", "West", "North", "South", "North-East", "South-West"];

export default function PredictionForm() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<PredictionRequest>({
    location: "",
    carpet_area_sqft: 0,
    floor_num: 0,
    bathroom: 1,
    balcony: 0,
    furnishing: FURNISHING_OPTS[0],
    transaction: TRANSACTION_OPTS[0],
    ownership: OWNERSHIP_OPTS[0],
    facing: FACING_OPTS[0],
  });

  useEffect(() => {
    fetchLocations()
      .then((locs) => {
        setLocations(locs);
        setForm((f) => ({ ...f, location: locs[0] ?? "" }));
      })
      .catch(() => setError("Could not load the location list."));
  }, []);

  function updateField<K extends keyof PredictionRequest>(key: K, value: PredictionRequest[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.location) {
      setError("Please choose a location.");
      return;
    }
    if (form.carpet_area_sqft <= 0) {
      setError("Carpet area must be greater than 0.");
      return;
    }

    setLoading(true);
    try {
      const result = await predictPrice(form);
      navigate("/result", { state: result });
    } catch {
      setError("Something went wrong reaching the prediction service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Location
        <select value={form.location} onChange={(e) => updateField("location", e.target.value)}>
          {locations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </label>

      <label>
        Carpet area (sqft)
        <input
          type="number"
          value={form.carpet_area_sqft}
          onChange={(e) => updateField("carpet_area_sqft", Number(e.target.value))}
        />
      </label>

      <label>
        Floor number
        <input
          type="number"
          value={form.floor_num}
          onChange={(e) => updateField("floor_num", Number(e.target.value))}
        />
      </label>

      <label>
        Bathrooms
        <input
          type="number"
          value={form.bathroom}
          onChange={(e) => updateField("bathroom", Number(e.target.value))}
        />
      </label>

      <label>
        Balconies
        <input
          type="number"
          value={form.balcony}
          onChange={(e) => updateField("balcony", Number(e.target.value))}
        />
      </label>

      <label>
        Furnishing
        <select value={form.furnishing} onChange={(e) => updateField("furnishing", e.target.value)}>
          {FURNISHING_OPTS.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      </label>

      <label>
        Transaction
        <select value={form.transaction} onChange={(e) => updateField("transaction", e.target.value)}>
          {TRANSACTION_OPTS.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      </label>

      <label>
        Ownership
        <select value={form.ownership} onChange={(e) => updateField("ownership", e.target.value)}>
          {OWNERSHIP_OPTS.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      </label>

      <label>
        Facing
        <select value={form.facing} onChange={(e) => updateField("facing", e.target.value)}>
          {FACING_OPTS.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      </label>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Predicting..." : "Predict price"}
      </button>
    </form>
  );
}
