"use client";

import React from "react";

export default function CartPage() {
  return (
    <div className="page-content">
      <h1 className="page-header">Winkelmandje</h1>
      <div className="cart-empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <p>Je winkelmandje is leeg</p>
        <p className="cart-empty__hint">Voeg producten toe via de zoekpagina of de homepage</p>
      </div>
    </div>
  );
}
