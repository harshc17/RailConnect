import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

// Define the shape of a booking object
interface Booking {
  id: string;
  passengerName: string;
  train: string;
  status: string;
}

const BookingManagement: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    // Connect to the Socket.IO server
    const socket: Socket = io('http://localhost:8080'); // Your backend server address

    // Listen for the initial list of bookings
    socket.on('initialBookings', (initialBookings: Booking[]) => {
      setBookings(initialBookings);
    });

    // Listen for new bookings
    socket.on('newBooking', (newBooking: Booking) => {
      // Add the new booking to the list
      setBookings((prevBookings) => [...prevBookings, newBooking]);
    });

    // Clean up the socket connection when the component unmounts
    return () => {
      socket.disconnect();
    };
  }, []); // The empty dependency array ensures this effect runs only once

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4 text-gray-800">
        Real-Time Booking Management
      </h1>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Booking ID</th>
              <th className="py-3 px-6 text-left">Passenger Name</th>
              <th className="py-3 px-6 text-left">Train</th>
              <th className="py-3 px-6 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-6 text-left whitespace-nowrap">
                  {booking.id}
                </td>
                <td className="py-3 px-6 text-left">
                  {booking.passengerName}
                </td>
                <td className="py-3 px-6 text-left">
                  {booking.train}
                </td>
                <td className="py-3 px-6 text-center">
                  <span className="bg-green-200 text-green-700 py-1 px-3 rounded-full text-xs">
                    {booking.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingManagement;
