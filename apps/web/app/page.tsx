export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>Runesse – Home</h1>
      <p style={{ marginTop: "0.5rem" }}>
        This is the placeholder landing page. Go to <code>/auth</code> to log in.
      </p>
    </main>
  );
}
