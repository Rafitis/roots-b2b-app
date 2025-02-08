// ErrorBoundary.jsx
import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", background: "#fdd", color: "#900" }}>
          <h2>Algo salió mal</h2>
          <p>{this.state.error?.message || "Error desconocido"}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
