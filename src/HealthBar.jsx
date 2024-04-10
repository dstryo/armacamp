import React from 'react'

function HealthBar({ health }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        width: '200px',
        height: '25px',
        border: '1px solid black',
        backgroundColor: 'white'
      }}>
      <div
        style={{
          width: `${health}%`,
          height: '100%',
          backgroundColor: 'red'
        }}
      />
    </div>
  )
}

export default HealthBar
