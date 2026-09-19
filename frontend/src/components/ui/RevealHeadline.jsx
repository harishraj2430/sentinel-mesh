export default function RevealHeadline({ lines, style }) {
  return (
    <h1 style={style}>
      {lines.map((line, i) => (
        <span key={i} className="headline-line" style={{ "--delay": `${i * 0.12}s` }}>
          <span>{line}</span>
        </span>
      ))}
    </h1>
  );
}