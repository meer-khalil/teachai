import React, { useContext, useState } from "react";

import { UserContext } from "../../context/UserContext";
import { Link } from "react-router-dom";

import image from '../../images/Edited/webp/login.jpeg'
import { FiEye, FiEyeOff } from 'react-icons/fi'


export default function Login() {

  const { login } = useContext(UserContext)

  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (event) => {
    console.log('Event: ', event);
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      email: formData.get("email"),
      password: formData.get("password"),
    }
    console.log(data);
    login(data)
  };

  return (
    <div className="h-[80vh] flex justify-center items-center" style={{
      backgroundImage: `url(${image})`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover'
    }}>
      <div className=" max-w-[95%] md:max-w-[60rem] rounded-2xl bg-white text-black px-10"
        style={{
          boxShadow: '0px 2px 45px -11px rgba(0,0,0,0.5)',
        }
        }
      >
        <form
          onSubmit={handleSubmit}
          className=" w-full"
        >

          <div className="flex-1 flex flex-col gap-2 my-7">

            <label  htmlFor="email">
              Email Address
            </label>
            <input
              required
              id="email"
              name="email"
              className="bg-transparent border h-10 px-3 rounded"
            />
          </div>


          <div className="flex flex-col gap-2 my-7">
            <label  htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                required
                name="password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="bg-transparent border h-10 px-3 rounded w-full"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
              >
                {showPassword ? <FiEyeOff className="h-5 w-5 text-gray-600" /> : <FiEye className="h-5 w-5 text-gray-600" />}
              </button>
            </div>
          </div>


          <div className="flex justify-between items-center">
            <Link to="/password/forgot">
              <p className=" text-xl">Forget Password?</p>
            </Link>
            <button type="submit" className="border-2 border-primary bg-primary text-white hover:text-secodnary hover:bg-secondary px-5 py-3 rounded">
              Login
            </button>
          </div>

          <p className="my-8 text-xl">Don't Have an Account? <Link to="/signup" className="font-semibold">Register</Link> </p>
        </form>
      </div>
    </div>
  );
}
