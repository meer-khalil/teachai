import React from 'react'
import { useContext } from 'react'
import { UserContext } from '../../../../context/UserContext'

const Users = () => {
  const { users } = useContext(UserContext)


  return (
    <div className="container mx-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">No.</th>
            <th className="py-2 px-4 border-b">First Name</th>
            <th className="py-2 px-4 border-b">Last Name</th>
            <th className="py-2 px-4 border-b">Role</th>
          </tr>
        </thead>
        <tbody>
          {users?.map((user, index) => (
            <tr key={user.id} className='text-center'>
              <td className="py-2 px-4 border-b">{index + 1}</td>
              <td className="py-2 px-4 border-b">{user.firstName}</td>
              <td className="py-2 px-4 border-b">{user.lastName}</td>
              <td className="py-2 px-4 border-b">{user.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

}

export default Users