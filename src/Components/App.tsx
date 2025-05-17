import { useState, useEffect } from "react";
import reactLogo from "../assets/react.svg";
import electron from "../assets/electron.svg.png";
import viteLogo from "/electron-vite.animate.svg";
import Table from "./Table";
import LoginRegister from "./LoginRegister"; // Import the new LoginRegister component

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
  scrapedAt: string; // Add scrapedAt field
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Track authentication status
  // Removed unused userRole state
  const [results, setResults] = useState<Place[]>([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedRegency, setSelectedRegency] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");
  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>([]);
  const [regencies, setRegencies] = useState<{ id: string; name: string }[]>([]);
  const [districts, setDistricts] = useState<{ id: string; name: string }[]>([]);
  const [villages, setVillages] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState(""); // Add state for search query
  const [showPopup, setShowPopup] = useState(false); // Add state for popup
  const [showSearchPopup, setShowSearchPopup] = useState(false); // Add state for search query popup

  useEffect(() => {
    window.ipcRenderer.on("scraping-done", (_event, results) => {
      console.log('Scraping done:', results);
      setResults((prevResults) => [...prevResults, ...results]); // Gabungkan data lama dengan data baru
    });

    window.ipcRenderer.on("scraping-error", (_event, error) => {
      console.error("Error during scraping:", error);
      // Handle error as needed
    });
  }, []);

  useEffect(() => {
    const fetchProvinces = async () => {
      const result = await window.ipcRenderer.invoke("get-provinces");
      setProvinces(result);
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      const fetchRegencies = async () => {
        const result = await window.ipcRenderer.invoke("get-regencies", selectedProvince);
        setRegencies(result);
      };
      fetchRegencies();
    } else {
      setRegencies([]);
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedRegency) {
      const fetchDistricts = async () => {
        const result = await window.ipcRenderer.invoke("get-districts", selectedRegency);
        setDistricts(result);
      };
      fetchDistricts();
    } else {
      setDistricts([]);
    }
  }, [selectedRegency]);

  useEffect(() => {
    if (selectedDistrict) {
      const fetchVillages = async () => {
        const result = await window.ipcRenderer.invoke("get-villages", selectedDistrict);
        setVillages(result);
      };
      fetchVillages();
    } else {
      setVillages([]);
    }
  }, [selectedDistrict]);

  const handleEdit = (updatedPlace: Place) => {
    console.log("Edit place:", updatedPlace);
    // Update the place in local state
    setResults((prevPlaces) =>
      prevPlaces.map((place) => (place.placeId === updatedPlace.placeId ? updatedPlace : place))
    );

    // Send the updated place to the main process to update the database
    window.ipcRenderer.send("update-place", updatedPlace);
  };

  const handleDelete = (placeId: string) => {
    console.log("Delete place with ID:", placeId);
    // Remove the place from local state
    setResults((prevPlaces) => prevPlaces.filter((place) => place.placeId !== placeId));

    // Send the placeId to the main process to delete it from the database
    window.ipcRenderer.invoke("delete-place", placeId)
      .then(() => console.log(`Place with ID ${placeId} deleted from database.`))
      .catch((error) => console.error(`Failed to delete place with ID ${placeId} from database:`, error));
  };

  const handleScraping = () => {
    if (!searchQuery.trim()) {
      setShowSearchPopup(true); // Show the search query popup
      return;
    }
  
    if (!selectedProvince || !selectedRegency) {
      setShowPopup(true); // Show the popup
      return;
    }
  
    // Build the full query by concatenating the search query with dropdown values
    const fullQuery = [
      searchQuery.trim(),
      provinces.find((p) => p.id === selectedProvince)?.name || "",
      regencies.find((r) => r.id === selectedRegency)?.name || "",
      districts.find((d) => d.id === selectedDistrict)?.name || "",
      villages.find((v) => v.id === selectedVillage)?.name || "",
    ]
      .filter(Boolean) // Remove empty values
      .join(" "); // Join with spaces
  
    const filters = {
      query: fullQuery,
      province: selectedProvince,
      regency: selectedRegency,
      district: selectedDistrict || null,
      village: selectedVillage || null,
    };
  
    console.log("Starting scraping with filters:", filters);
    window.ipcRenderer.send("start-scraping", filters);
  };

  return (
    <div className="container mx-auto">
      {!isAuthenticated ? (
        <LoginRegister
          onLogin={() => {
            setIsAuthenticated(true);
          }}
        />
      ) : (
        // Show the scraping interface if authenticated
        <>
          {/* You can use `userRole` here to customize the interface for admin or user */}
          <div className="flex justify-center items-center my-8">
            <div className="text-center">
              <div className="flex justify-center">
                <a
                  className="mx-4"
                  href="https://electron-vite.github.io"
                  target="_blank"
                >
                  <img
                    src={electron}
                    className="w-24 h-24 mb-4 mx-auto"
                    alt="Electron logo"
                  />
                </a>
                <a className="mx-4" href="https://react.dev" target="_blank">
                  <img
                    src={reactLogo}
                    className="w-24 h-24 mb-4 mx-auto"
                    alt="React logo"
                  />
                </a>
                <a
                  className="mx-4"
                  href="https://electron-vite.github.io"
                  target="_blank"
                >
                  <img
                    src={viteLogo}
                    className="w-24 h-24 mb-4 mx-auto"
                    alt="Vite logo"
                  />
                </a>
              </div>

              <h1 className="text-3xl font-bold mb-2">Google Maps Scrapping</h1>
              <div className="text-center text-sm text-gray-500">
                created by IT Intern United Farmatic Indonesia
              </div>
              
            </div>
          </div>
          
          <div className="flex justify-center my-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter search query"
              className="border border-gray-300 rounded px-4 py-2 w-1/2"
            />
          </div>

          <div className="flex justify-center my-4 space-x-2">
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="border border-gray-300 rounded px-4 py-2"
              required
            >
              <option value="">Pilih Provinsi</option>
              {provinces.map((province) => (
                <option key={province.id} value={province.id}>
                  {province.name}
                </option>
              ))}
            </select>
            <select
              value={selectedRegency}
              onChange={(e) => setSelectedRegency(e.target.value)}
              className="border border-gray-300 rounded px-4 py-2"
              disabled={!selectedProvince}
              required
            >
              <option value="">Pilih Kabupaten/Kota</option>
              {regencies.map((regency) => (
                <option key={regency.id} value={regency.id}>
                  {regency.name}
                </option>
              ))}
            </select>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="border border-gray-300 rounded px-4 py-2"
              disabled={!selectedRegency}
            >
              <option value="">Pilih Kecamatan</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="border border-gray-300 rounded px-4 py-2"
              disabled={!selectedDistrict}
            >
              <option value="">Pilih Desa/Kelurahan</option>
              {villages.map((village) => (
                <option key={village.id} value={village.id}>
                  {village.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-center my-4">
            <button
              onClick={handleScraping}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Mulai Ambil Data
            </button>
          </div>
          {showSearchPopup && (
            <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
              <div className="bg-white p-6 rounded shadow-lg text-center">
                <p className="mb-4">Please enter a search query.</p>
                <button
                  onClick={() => setShowSearchPopup(false)}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  OK
                </button>
              </div>
            </div>
          )}
          {showPopup && (
            <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
              <div className="bg-white p-6 rounded shadow-lg text-center">
                <p className="mb-4">Please select both Province and Regency before starting the scraping process.</p>
                <button
                  onClick={() => setShowPopup(false)}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  OK
                </button>
              </div>
            </div>
          )}
          <div className="flex justify-center items-center my-8">
            <Table places={results} onEdit={handleEdit} onDelete={handleDelete} />
          </div>
        </>
      )}
    </div>
  );
}

export default App;