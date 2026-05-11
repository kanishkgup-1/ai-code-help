function FeatureCard({ title, description, eyebrow }) {
  return (
    <article className="feature-card">
      <span className="feature-eyebrow">{eyebrow}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}

export default FeatureCard;

