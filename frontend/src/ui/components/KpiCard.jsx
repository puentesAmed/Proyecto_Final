import React from 'react'

export function KpiCard({ title, value, hint }){ return (
  <div className="card">
    <div style={{opacity:.8}}>{title}</div>
    <div style={{fontSize:28,fontWeight:700}}>{value}</div>{hint&&<small style={{opacity:.7}}>{hint}</small>}</div>
)}
