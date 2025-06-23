"use client";

import React from "react";
import dynamic from "next/dynamic";

const DashboardContent = dynamic(() => import("./DashboardContent"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #e0e7ff 100%)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ marginBottom: "16px" }}>Loading...</div>
      </div>
    </div>
  ),
});

export default function DashboardPage() {
  return <DashboardContent />;
}
