import React from 'react'
import styles from "./Not_Found.module.css"
import { useNavigate } from 'react-router-dom'

function Not_Found() {
  const navigate = useNavigate();
  const homepage=()=>{
    navigate("/");

  }
  return (
    <>
      <div className={styles.container}>
        <h1>404</h1>
        <p>Page Not Found</p>
        <button onClick={() => window.history.back()}>Go Back</button>
        <button onClick={homepage}>Go Home</button>
      </div>
    </>
  )
}

export default Not_Found