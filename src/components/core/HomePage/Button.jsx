import React from 'react'
import {Link} from "react-router-dom"

const Button = ({children, active, linkto}) => {
  return (
    <Link to={linkto}>

        <div className={`text-center font-lg p-[24px] py-[12px] rounded-md font-medium
        ${active ? "bg-yellow-50 text-black":" bg-richblack-800 drop-shadow-[2px_2px_rgba(255,255,255,0.18)]"}
        hover:scale-95 transition-all duration-200
        `}>
            {children}
        </div>

    </Link>
  )
}

export default Button
