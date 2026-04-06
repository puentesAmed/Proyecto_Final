import React from "react";

export function DataTable({ columns, rows}){
    return (
        <div className="card">
            <table className="table">
                <thead>
                    <tr>
                        {columns.map(col => <th key={String(col.key)}>{col.header}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r,i) => 
                        <tr key={i}>
                            {columns.map(col => <td key={String(col.key)}>{col.render?col.render(r):r[col.key]}</td>)}
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}