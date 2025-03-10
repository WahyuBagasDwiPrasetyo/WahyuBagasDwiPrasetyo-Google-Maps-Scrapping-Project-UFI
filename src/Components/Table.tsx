import React, { useState } from "react";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface Place {
  index: number;
  storeName: string;
  placeId: string;
  address: string;
  category: string;
  phone?: string;
  googleUrl: string;
  bizWebsite?: string;
  ratingText: string;
  latitude: number;
  longitude: number;
}

interface TableProps {
  places: Place[];
}

const Table: React.FC<TableProps> = ({ places }) => {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  if (!places) {
    return <div>No data available</div>;
  }

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(places);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  
    saveAs(blob, "data.xlsx");
  };

  const handleDetailClick = (place: Place) => {
    setSelectedPlace(place);
  };

  const handleCloseDetail = () => {
    setSelectedPlace(null);
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
          <button onClick={exportToExcel} className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-4 rounded">Export to Excel</button>
          <table className="min-w-full divide-y divide-gray-200 mt-3">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  No
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Nama
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Rating & Ulasan
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  No. Telp
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Detail
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {places.map((item, index) => (
                <tr key={item.storeName}>
                  <td className="px-6 py-4 whitespace-normal">
                    <div className="text-sm text-gray-900">{index + 1}</div>
                  </td>
                  <td className="px-6 py-4">
                    <a href={item.googleUrl} target="_blank" rel="noreferrer">
                      <span className="inline-block text-sm leading-5 font-semibold bg-green-100 text-green-800 whitespace-normal px-2 py-1">
                        {item.storeName}
                      </span>
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      🌟 {item.ratingText}{" "}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-normal">
                    <button 
                      onClick={() => handleDetailClick(item)} 
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPlace && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Detail Lokasi</h2>
            <p><strong>Nama:</strong> {selectedPlace.storeName}</p>
            <p><strong>Alamat:</strong> {selectedPlace.address}</p>
            <p><strong>Latitude:</strong> {selectedPlace.latitude}</p>
            <p><strong>Longitude:</strong> {selectedPlace.longitude}</p>
            <button onClick={handleCloseDetail} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;