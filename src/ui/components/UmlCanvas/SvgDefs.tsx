export function SvgDefs() {
  return (
    <defs>
      {/* Hollow arrow for inheritance/implementation */}
      <marker
        id="arrow-hollow"
        viewBox="0 0 20 20"
        refX="20"
        refY="10"
        markerWidth="10"
        markerHeight="10"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 20 10 L 0 20 z" fill="#0f0f23" stroke="#888" strokeWidth="2" />
      </marker>

      {/* Filled diamond for composition */}
      <marker
        id="diamond-filled"
        viewBox="0 0 20 20"
        refX="20"
        refY="10"
        markerWidth="10"
        markerHeight="10"
        orient="auto-start-reverse"
      >
        <path d="M 0 10 L 10 0 L 20 10 L 10 20 z" fill="#888" stroke="#888" strokeWidth="1" />
      </marker>

      {/* Hollow diamond for aggregation */}
      <marker
        id="diamond-hollow"
        viewBox="0 0 20 20"
        refX="20"
        refY="10"
        markerWidth="10"
        markerHeight="10"
        orient="auto-start-reverse"
      >
        <path d="M 0 10 L 10 0 L 20 10 L 10 20 z" fill="#0f0f23" stroke="#888" strokeWidth="2" />
      </marker>

      {/* Open arrow for dependency/association */}
      <marker
        id="arrow-open"
        viewBox="0 0 20 20"
        refX="18"
        refY="10"
        markerWidth="8"
        markerHeight="8"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 20 10 L 0 20" fill="none" stroke="#888" strokeWidth="2" />
      </marker>
    </defs>
  );
}
