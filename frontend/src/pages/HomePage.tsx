import PredictionForm from "../components/PredictionForm";

export default function HomePage() {
  return (
    <div>
      <h1>House Price Predictor</h1>
      <p>Enter the property details below to get an estimated price.</p>
      <PredictionForm />
    </div>
  );
}
