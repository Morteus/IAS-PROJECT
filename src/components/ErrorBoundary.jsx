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
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Reset error state after showing alert
      setTimeout(() => {
        this.setState({ hasError: false, error: null });
      }, 100);

      alert(
        `An error occurred: ${this.state.error?.message || "Unknown error"}`
      );
      return this.props.children;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
