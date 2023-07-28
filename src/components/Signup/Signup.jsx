import React, { useContext } from "react";


// import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";

import login from '../../images/check.avif'

export default function Signup() {

  // const navigate = useNavigate();
  const { register } = useContext(UserContext);


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
      password: formData.get('password'),
      // role: 'buyer',
      // cardName: formData.get('cardName') || 'Khalil Ahmad',
      // cardNumber: formData.get('cardNumber') || '1234 1234 1234 1234',
      // cardMonth: formData.get('cardMonth') || '09',
      // cardYear: formData.get('cardYear') || '23',
      // cardCvv: formData.get('cardCvv') || '123',
    }

    register(data)
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

          <div className="flex justify-end">
            <button className="border-2 border-primary bg-primary text-white hover:text-secodnary hover:bg-secondary px-5 py-3 rounded">
              Sign Up
            </button>

          </div>
        </form>
      </div>
    </div>

  );
}
