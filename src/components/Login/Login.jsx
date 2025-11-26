import React, { useContext, useState } from "react";
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'

import { UserContext } from "../../context/UserContext";
import { Link } from "react-router-dom";

import image from '../../images/Edited/webp/login.jpeg'
import { FiEye, FiEyeOff } from 'react-icons/fi'


export default function Login() {

  const { login } = useContext(UserContext)

  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { email: '', password: '' }
  })

  const onSubmit = async (data) => {
    try {
      await login(data)
    } catch (err) {
      console.error('Login handler error:', err)
      toast.error('Login failed. Please try again.')
    }
  }

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
          onSubmit={handleSubmit(onSubmit)}
          className=" w-full"
          noValidate
        >

          <div className="flex-1 flex flex-col gap-2 my-7">

            <label  htmlFor="email">
              Email Address
            </label>
            <input
              required
              id="email"
              type="email"
              autoComplete="email"
              {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' } })}
              className="bg-transparent border h-10 px-3 rounded"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>


          <div className="flex flex-col gap-2 my-7">
            <label  htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                required
                id="password"
                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
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
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>
          </div>


            <div className="flex justify-between items-center">
              <Link to="/password/forgot" aria-label="Forgot password" className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-300 rounded">
                <span className="text-lg md:text-xl">Forgot password?</span>
              </Link>
              <button type="submit" disabled={isSubmitting} className="border-2 border-primary bg-primary text-white hover:text-secodnary hover:bg-secondary px-5 py-3 rounded disabled:opacity-60">
                {isSubmitting ? 'Logging in…' : 'Login'}
              </button>
            </div>

          <p className="my-8 text-xl">Don't have an account? <Link to="/signup" aria-label="Sign up" className="font-semibold text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-300 rounded">Register</Link></p>
        </form>
      </div>
    </div>
  );
}
