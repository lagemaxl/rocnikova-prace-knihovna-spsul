import React from "react";
import "./style/StatCard.css";

function StatCard({ title, value, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-card-content">
        <div className="stat-card-header">
          <div className="stat-card-icon">{icon}</div>
          <div className="stat-card-info">
            <p className="stat-card-title">{title}</p>
            <h3 className="stat-card-value">{value}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatCard;
