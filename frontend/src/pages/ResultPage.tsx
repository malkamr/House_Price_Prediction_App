import { useLocation, Link } from "react-router-dom";
import type { PredictionResponse } from "../types/prediction";

function formatInr(value: number): string {
  if (value >= 1e7) {
    return `₹${(value / 1e7).toFixed(2)} Cr`;
  }
  return `₹${(value / 1e5).toFixed(1)} Lac`;
}

export default function ResultPage() {
  const location = useLocation();
  const result = location.state as PredictionResponse | null;

  if (!result) {
    return (
      <div>
        <p>No prediction yet.</p>
        <Link to="/">Go back</Link>
      </div>
    );
  }

  return (
    <div>
      <h1>Predicted Price</h1>
      <p style={{ fontSize: "2rem" }}>{formatInr(result.predicted_price)}</p>
      <p>
        Likely between {formatInr(result.low_estimate)} and {formatInr(result.high_estimate)}
      </p>
      <Link to="/">Try another property</Link>
    </div>
  );
}
