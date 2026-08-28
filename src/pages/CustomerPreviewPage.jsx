import React, { useEffect, useState } from "react";
import { Helmet } from "@/lib/helmet-compat";
import { Link, useParams } from "@/lib/router-compat";
import { Loader2 } from "lucide-react";

import { fetchCustomerPreviewHtml } from "../api/preview.api";

const shellStyle = {
  minHeight: "100vh",
  background: "#0f172a",
  color: "#ffffff",
};

const buttonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  minHeight: 36,
  padding: "0 12px",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 800,
};

export default function CustomerPreviewPage({ slug }) {
  const params = useParams();
  const previewSlug = slug ?? params.previewSlug ?? params._splat;
  const [state, setState] = useState({
    loading: true,
    error: "",
  });

  useEffect(() => {
    let active = true;

    async function loadPreview() {
      try {
        const html = await fetchCustomerPreviewHtml(previewSlug || "");

        if (!active) return;

        document.open();
        document.write(html);
        document.close();
      } catch (error) {
        if (!active) return;

        setState({
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Preview kon niet worden geladen.",
        });
      }
    }

    loadPreview();

    return () => {
      active = false;
    };
  }, [previewSlug]);

  if (state.loading) {
    return (
      <main style={shellStyle}>
        <Helmet>
          <meta name="robots" content="noindex,nofollow,noarchive" />
        </Helmet>
        <style>{`@keyframes preview-spin { to { transform: rotate(360deg); } }`}</style>
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            gap: 10,
            alignContent: "center",
          }}
        >
          <Loader2 size={24} style={{ animation: "preview-spin 1s linear infinite" }} />
          <div style={{ fontWeight: 800 }}>Preview laden</div>
        </div>
      </main>
    );
  }

  if (state.error) {
    return (
      <main style={shellStyle}>
        <Helmet>
          <title>Preview niet beschikbaar | Vedantix</title>
          <meta name="robots" content="noindex,nofollow,noarchive" />
        </Helmet>
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 20,
            textAlign: "center",
          }}
        >
          <div>
            <h1 style={{ fontSize: 28, marginBottom: 8 }}>Preview niet beschikbaar</h1>
            <p style={{ color: "#cbd5e1", marginBottom: 18 }}>
              {state.error}
            </p>
            <Link to="/" style={buttonStyle}>
              Terug naar Vedantix
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return null;
}
