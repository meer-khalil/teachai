import React, { useContext, useState } from "react";


import './DisabledButton.css';

// import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";

import login from '../../images/check.webp'
import SignupLoader from "../commons/SignupLoader";

export default function Signup() {

  const [loading, setLoading] = useState(false);

  // const navigate = useNavigate();
  const { register } = useContext(UserContext);


  // Initialize state using the useState hook
  const [allow, setAllow] = useState(false);


  // Function to update the 'allow' state
  const handleCheckboxChange = () => {
    setAllow(!allow);
  };

  const handleSubmit = async (event) => {

    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (formData.get('password') !== formData.get('password1')) {
      console.log("Password doesn't match");
      alert("Passowor is not matched!")
      return
    }

    const data = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      password: formData.get('password')
    }
    setLoading(true);
    register(data, setLoading)
  };

  return (

    <div className="h-[80vh] flex justify-center items-center" style={{
      backgroundImage: `url(${login})`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover'
    }}>
      <div className=" max-w-[60rem] rounded-[1.5rem] bg-transparent"
        style={{
          // boxShadow: '0px 2px 45px -11px rgba(0,0,0,0.5)',
        }
        }
      >
        <form
          onSubmit={handleSubmit}
          className="m-12"
        >
          <div className="flex gap-5">

            <div className=" flex-1 flex flex-col gap-2">
              <label className="text-white" htmlFor="firstName">
                First Name
              </label>
              <input
                name="firstName"
                id="firstName"
                className=" bg-transparent border h-10 px-3 rounded text-black border-white"
              />
            </div>
            <div className=" flex-1 flex flex-col gap-2">
              <label className="text-white" htmlFor="firstName">
                Last Name
              </label>
              <input
                name="lastName"
                id="lasstName"
                className="bg-transparent border h-10 px-3 rounded text-black border-white"
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-2 my-7">

            <label className="text-white" htmlFor="email">
              Email Address
            </label>
            <input
              required
              id="email"
              name="email"
              className="bg-transparent border h-10 px-3 rounded text-black border-white"
            />
          </div>

          <div className="flex gap-5">
            <div className="flex-1 flex flex-col gap-2 my-7">
              <label className="text-white" htmlFor="password">
                Password
              </label>
              <input
                required
                name="password"
                type="password"
                id="password"
                className="bg-transparent border h-10 px-3 rounded text-black border-white"
              />
            </div>
            <div className="flex-1 flex flex-col gap-2 my-7">
              <label className="text-white" htmlFor="password1">
                Re-Password
              </label>
              <input
                required
                name="password1"
                type="password"
                id="password1"
                className="bg-transparent border h-10 px-3 rounded text-black border-white"
              />
            </div>
          </div>
          <div className="flex items-start gap-2 my-7">
            <input type="checkbox" id="terms" className=" h-5 w-5" onChange={handleCheckboxChange} />
            <label htmlFor="terms" className=" text-white">
              I agree to the Terms and Conditions, Privacy Policy, and Cookie Policy
            </label>
          </div>

          <div className="flex justify-end">
            <button
              disabled={!allow}
              className={`${!allow ? 'disabled-button' : ''} relative border-2 border-primary bg-primary text-white hover:text-secodnary hover:bg-secondary px-5 py-3 rounded`}>
              {
                loading &&
                <div className=" absolute top-0 right-0 bottom-0 left-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
                  <SignupLoader />
                </div>
              }
              Sign Up
            </button>

          </div>
        </form>
      </div>
    </div>

  );
}
