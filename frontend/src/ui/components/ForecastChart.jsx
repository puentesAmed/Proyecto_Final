import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'


export function ForecastChart({ data }){
  return (<div className="card" style={{height:360}}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date"/><YAxis/><Tooltip/><Line type="monotone" dataKey="total" dot={false}/>
      </LineChart>
    </ResponsiveContainer>
  </div>)
}
