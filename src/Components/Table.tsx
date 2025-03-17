import React, { useState, useEffect } from "react";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface Place {
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
  scrapedAt: string; // Add scrapedAt field
}

interface TableProps {
  places: Place[];
  onEdit: (place: Place) => void;
  onDelete: (placeId: string) => void;
}

const Table: React.FC<TableProps> = ({ places, onEdit, onDelete }) => {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortType, setSortType] = useState<'highestRating' | 'lowestRating' | 'highestReviews' | 'lowestReviews' | 'aToZ' | 'zToA' | ''>('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Partial<Place>>({});
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [confirmation, setConfirmation] = useState<{ action: string; data?: any } | null>(null);
  const [alert, setAlert] = useState<string | null>(null);
  const [dailyTarget, setDailyTarget] = useState<number>(100); // Default daily target
  const [scrappedToday, setScrappedToday] = useState<number>(0);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortType, itemsPerPage]);

  useEffect(() => {
    // Simulate fetching today's scrapped count from the backend
    const fetchScrappedToday = async () => {
      const count = await window.ipcRenderer.invoke("get-scrapped-today");
      setScrappedToday(count);
    };
    fetchScrappedToday();
  }, []);

  if (!places || places.length === 0) {
    return <div>No data available</div>;
  }

  const exportToExcel = () => {
    const exportData = places.map(place => ({
      No: place.index,
      Name: place.storeName,
      Address: place.address,
      Category: place.category,
      Rating: extractRating(place.ratingText),
      Reviews: extractReviews(place.ratingText),
      Phone: place.phone || 'N/A',
      Website: place.bizWebsite || 'N/A',
      GoogleMaps: place.googleUrl,
      Latitude: place.latitude,
      Longitude: place.longitude
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
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

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(parseInt(e.target.value));
  };

  const extractRating = (ratingText: string) => {
    const match = ratingText.match(/(\d+,\d+)/);
    return match ? parseFloat(match[1].replace(',', '.')) : 0;
  };

  const extractReviews = (ratingText: string) => {
    const match = ratingText.match(/bintang\s+(\d+)/i);
    return match ? parseInt(match[1], 10) : 0;
  };

  const handleSortChange = (newSortType: 'highestRating' | 'lowestRating' | 'highestReviews' | 'lowestReviews' | 'aToZ' | 'zToA' | '') => {
    if (sortType === newSortType) {
      setSortType('');
    } else {
      setSortType(newSortType);
    }
    // Preserve the current page when sorting
    setCurrentPage(currentPage);
  };

  const startEditing = (placeId: string) => {
    const placeToEdit = places.find(p => p.placeId === placeId);
    if (placeToEdit) {
      setEditingId(placeId);
      setEditedData({ ...placeToEdit });
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditedData({});
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedData({
      ...editedData,
      [e.target.name]: e.target.value
    });
  };

  const saveChanges = async () => {
    setConfirmation({ action: "edit" });
  };

  const confirmEdit = async () => {
    if (editingId && Object.keys(editedData).length > 0) {
      const updatedPlace = places.find(p => p.placeId === editingId);
      if (updatedPlace) {
        const finalData = { ...updatedPlace, ...editedData };
        onEdit(finalData as Place);

        // Send updated data to the backend
        try {
          await window.ipcRenderer.invoke('update-place', finalData);
          console.log('Data successfully updated in the database');
        } catch (error) {
          console.error('Failed to update data in the database:', error);
        }

        setEditingId(null);
        setEditedData({});
      }
    }
    setConfirmation(null);
  };

  const handleDeleteClick = (placeId: string) => {
    setConfirmation({ action: "delete", data: placeId });
  };

  const confirmDelete = () => {
    if (confirmation?.data) {
      onDelete(confirmation.data);
    }
    setConfirmation(null);
  };

  const toggleSelectRow = (placeId: string) => {
    setSelectedRows(prev => {
      const updated = new Set(prev);
      if (updated.has(placeId)) {
        updated.delete(placeId);
      } else {
        updated.add(placeId);
      }
      return updated;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === currentItems.length) {
      setSelectedRows(new Set());
    } else {
      const allIds = currentItems.map(item => item.placeId);
      setSelectedRows(new Set(allIds));
    }
  };

  const deleteSelectedRows = () => {
    if (selectedRows.size === 0) {
      setAlert("Gagal: Anda belum memilih data.");
      return;
    }
    setConfirmation({ action: "deleteSelected" });
  };

  const exportSelectedToExcel = () => {
    if (selectedRows.size === 0) {
      setAlert("Gagal: Anda belum memilih data.");
      return;
    }
    setConfirmation({ action: "download" });
  };

  const confirmExport = () => {
    const exportData = sortedPlaces
      .filter(place => !selectedRows.has(place.placeId))
      .map(place => ({
        No: place.index,
        Name: place.storeName,
        Address: place.address,
        Category: place.category,
        Rating: extractRating(place.ratingText),
        Reviews: extractReviews(place.ratingText),
        Phone: place.phone || 'N/A',
        Website: place.bizWebsite || 'N/A',
        GoogleMaps: place.googleUrl,
        Latitude: place.latitude,
        Longitude: place.longitude
      }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

    saveAs(blob, "filtered_data.xlsx");
    setConfirmation(null);
  };

  // Remove duplicates based on placeId
  const removeDuplicates = (places: Place[]) => {
    const uniquePlaces = new Map<string, Place>();
    places.forEach(place => {
      uniquePlaces.set(place.placeId, place);
    });
    return Array.from(uniquePlaces.values());
  };

  let sortedPlaces = removeDuplicates([...places]);

  // Filter places based on the search term
  const filteredPlaces = sortedPlaces.filter(place =>
    place.storeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate indices for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Determine the data to sort
  let currentItems = itemsPerPage === -1 ? filteredPlaces : filteredPlaces.slice(indexOfFirstItem, indexOfLastItem);

  if (sortType) {
    currentItems.sort((a, b) => {
      switch (sortType) {
        case 'highestRating':
          return extractRating(b.ratingText) - extractRating(a.ratingText);
        case 'lowestRating':
          return extractRating(a.ratingText) - extractRating(b.ratingText);
        case 'highestReviews':
          return extractReviews(b.ratingText) - extractReviews(a.ratingText);
        case 'lowestReviews':
          return extractReviews(a.ratingText) - extractReviews(b.ratingText);
        case 'aToZ':
          return a.storeName.localeCompare(b.storeName);
        case 'zToA':
          return b.storeName.localeCompare(a.storeName);
        default:
          return 0;
      }
    });
  }

  // Recalculate total pages
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredPlaces.length / itemsPerPage);

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDailyTarget(parseInt(e.target.value) || 0);
  };

  return (
    <div className="overflow-x-auto">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-lg font-semibold mb-2">Target Harian</h2>
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Target Harian:
            </label>
            <input
              type="number"
              value={dailyTarget}
              onChange={handleTargetChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <p className="text-sm">
              <strong>Sudah Terkumpul:</strong> {scrappedToday} / {dailyTarget}
            </p>
            <p
              className={`text-sm font-medium ${
                scrappedToday >= dailyTarget ? "text-green-500" : "text-red-500"
              }`}
            >
              {scrappedToday >= dailyTarget
                ? "Target Tercapai 🎉"
                : "Belum Mencapai Target"}
            </p>
          </div>
        </div>
      </div>
      <div className="inline-block min-w-full">
        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
          <div className="flex items-center justify-between p-4">
            <div className="flex space-x-2">
              <button onClick={exportToExcel} className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-4 rounded">
                Download Semua Data
              </button>
              <button onClick={exportSelectedToExcel} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded">
                Download Data Terpilih
              </button>
            </div>
            <button onClick={deleteSelectedRows} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-4 rounded">
              Hapus Data Terpilih
            </button>
          </div>
          <div className="px-4">
            <input
              type="text"
              placeholder="Search by Name"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full mt-3 mb-3 px-4 py-2 border border-gray-300 rounded"
            />
          </div>
          <table className="min-w-full divide-y divide-gray-200 mt-3">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === currentItems.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama
                  <button 
                    onClick={() => handleSortChange('aToZ')} 
                    className={`ml-2 text-xs font-medium ${sortType === 'aToZ' ? 'text-blue-500' : 'text-gray-500'}`}
                  >▲</button>
                  <button 
                    onClick={() => handleSortChange('zToA')} 
                    className={`ml-2 text-xs font-medium ${sortType === 'zToA' ? 'text-blue-500' : 'text-gray-500'}`}
                  >▼</button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                  <button 
                    onClick={() => handleSortChange('highestRating')} 
                    className={`ml-2 text-xs font-medium ${sortType === 'highestRating' ? 'text-blue-500' : 'text-gray-500'}`}
                  >▲</button>
                  <button 
                    onClick={() => handleSortChange('lowestRating')} 
                    className={`ml-2 text-xs font-medium ${sortType === 'lowestRating' ? 'text-blue-500' : 'text-gray-500'}`}
                  >▼</button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ulasan
                  <button 
                    onClick={() => handleSortChange('highestReviews')} 
                    className={`ml-2 text-xs font-medium ${sortType === 'highestReviews' ? 'text-blue-500' : 'text-gray-500'}`}
                  >▲</button>
                  <button 
                    onClick={() => handleSortChange('lowestReviews')} 
                    className={`ml-2 text-xs font-medium ${sortType === 'lowestReviews' ? 'text-blue-500' : 'text-gray-500'}`}
                  >▼</button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Telp</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Diambil</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detail</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((item, index) => (
                <tr key={item.placeId}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(item.placeId)}
                      onChange={() => toggleSelectRow(item.placeId)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-normal">
                    <div className="text-sm text-gray-900">{indexOfFirstItem + index + 1}</div>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === item.placeId ? (
                      <input
                        type="text"
                        name="storeName"
                        value={editedData.storeName || ''}
                        onChange={handleFieldChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      <a href={item.googleUrl} target="_blank" rel="noreferrer">
                        <span className="inline-block text-sm leading-5 font-semibold bg-green-100 text-green-800 whitespace-normal px-2 py-1">
                          {item.storeName}
                        </span>
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      🌟 {extractRating(item.ratingText)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {extractReviews(item.ratingText)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === item.placeId ? (
                      <input
                        type="text"
                        name="phone"
                        value={editedData.phone || ''}
                        onChange={handleFieldChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">
                        {item.phone && item.phone.trim() !== '' ? item.phone : 'N/A'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(item.scrapedAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-normal">
                    <button 
                      onClick={() => handleDetailClick(item)} 
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Detail
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-normal">
                    {editingId === item.placeId ? (
                      <div className="flex space-x-2">
                        <button 
                          onClick={saveChanges} 
                          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                        >
                          Save
                        </button>
                        <button 
                          onClick={cancelEditing} 
                          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => startEditing(item.placeId)} 
                          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(item.placeId)} 
                          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700 mb-2">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPlaces.length)} of {filteredPlaces.length} results
                {sortType && (
                  <span className="ml-2 font-medium">
                    (Sorted by: {sortType === 'highestRating' ? 'Highest Rating' : sortType === 'lowestRating' ? 'Lowest Rating' : sortType === 'highestReviews' ? 'Highest Reviews' : sortType === 'lowestReviews' ? 'Lowest Reviews' : sortType === 'aToZ' ? 'A-Z' : 'Z-A'})
                  </span>
                )}
              </div>
              <div>
                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="bg-white text-black font-bold py-1 px-4 rounded"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="-1">All</option>
                </select>
              </div>
            </div>
            <div className="pagination flex justify-center">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-4 rounded mr-2 disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`font-bold py-1 px-4 rounded mr-2 ${
                    currentPage === pageNumber
                      ? 'bg-yellow-500 text-white' // Change active page color to yellow
                      : 'bg-blue-500 hover:bg-blue-700 text-white'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-4 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedPlace && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-md w-full">
            <div>
              <h2 className="text-xl font-semibold mb-4">Detail Lokasi</h2>
              <p className="mb-2"><strong>Nama:</strong> {selectedPlace.storeName}</p>
              <p className="mb-2"><strong>Alamat:</strong> {selectedPlace.address}</p>
              <p className="mb-2"><strong>Kategori:</strong> {selectedPlace.category}</p>
              <p className="mb-2"><strong>Rating:</strong> 🌟 {extractRating(selectedPlace.ratingText)}</p>
              <p className="mb-2"><strong>Jumlah Ulasan:</strong> {extractReviews(selectedPlace.ratingText)}</p>
              <p className="mb-2"><strong>Telepon:</strong> {selectedPlace.phone && selectedPlace.phone.trim() !== '' ? selectedPlace.phone : 'N/A'}</p>
              <p className="mb-2"><strong>Website:</strong> {selectedPlace.bizWebsite ? (
                <a href={selectedPlace.bizWebsite} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                  {selectedPlace.bizWebsite}
                </a>
              ) : 'N/A'}</p>
              <p className="mb-2"><strong>Google Maps:</strong> 
                <a href={selectedPlace.googleUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline ml-2">
                  View on Google Maps
                </a>
              </p>
              <p className="mb-2"><strong>Coordinates:</strong> {selectedPlace.latitude}, {selectedPlace.longitude}</p>
              <div className="mt-4 flex justify-end">
                <button onClick={handleCloseDetail} className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmation && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Konfirmasi</h2>
            <p className="mb-4">
              {confirmation.action === "download" && "Apakah Anda yakin ingin mendownload data terpilih?"}
              {confirmation.action === "delete" && "Apakah Anda yakin ingin menghapus data ini?"}
              {confirmation.action === "edit" && "Apakah Anda yakin ingin menyimpan perubahan data ini?"}
            </p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setConfirmation(null)} className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded">
                Batalkan
              </button>
              <button
                onClick={
                  confirmation.action === "download"
                    ? confirmExport
                    : confirmation.action === "delete"
                    ? confirmDelete
                    : confirmEdit
                }
                className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

      {alert && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Peringatan</h2>
            <p className="mb-4">{alert}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setAlert(null)}
                className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;