import React from "react";

type ConfirmDeleteOverlayProps = {
  title?: string;
  message?: string;
  confirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmDeleteOverlay: React.FC<ConfirmDeleteOverlayProps> = ({
  title = "Delete",
  message = "Are you sure you want to delete this? This action cannot be undone.",
  confirming = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top, rgba(15,23,42,0.35), rgba(2,6,23,0.9))",
        backdropFilter: "blur(18px)",
      }}
    >
      <div
        style={{
          maxWidth: 460,
          width: "92%",
          borderRadius: 22,
          border: "1px solid rgba(15,23,42,0.9)",
          background:
            "linear-gradient(145deg, rgba(15,23,42,0.98), rgba(15,23,42,0.92))",
          boxShadow: "0 32px 90px rgba(0,0,0,0.95)",
          padding: "22px 24px 18px",
          color: "#E5E7EB",
        }}
      >
        <h2
          style={{
            margin: 0,
            marginBottom: 8,
            fontSize: 18,
            fontWeight: 700,
            color: "#F9FAFB",
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: 0,
            marginBottom: 18,
            fontSize: 13,
            lineHeight: 1.7,
            color: "#CBD5F5",
          }}
        >
          {message}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 4,
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={confirming}
            style={{
              padding: "7px 14px",
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.45)",
              background: "rgba(15,23,42,0.95)",
              color: "#E5E7EB",
              fontSize: 12,
              cursor: confirming ? "default" : "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            style={{
              padding: "7px 18px",
              borderRadius: 999,
              border: "none",
              background: confirming
                ? "linear-gradient(to right,#B91C1C,#7F1D1D)"
                : "linear-gradient(to right,#EF4444,#B91C1C)",
              color: "#F9FAFB",
              fontSize: 12,
              fontWeight: 600,
              cursor: confirming ? "default" : "pointer",
              opacity: confirming ? 0.9 : 1,
            }}
          >
            {confirming ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteOverlay;
