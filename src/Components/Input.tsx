import React, { useState, useEffect } from "react";

interface Wilayah {
    id: string;    // kode wilayah
    name: string;  // nama wilayah
}

export default function Input() {
    const [name, setName] = useState("");
    const [provinces, setProvinces] = useState<Wilayah[]>([]);
    const [regencies, setRegencies] = useState<Wilayah[]>([]);
    const [districts, setDistricts] = useState<Wilayah[]>([]);
    const [villages, setVillages] = useState<Wilayah[]>([]);
    
    const [selectedProvince, setSelectedProvince] = useState("");
    const [selectedRegency, setSelectedRegency] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const [selectedVillage, setSelectedVillage] = useState("");
    
    const [loading, setLoading] = useState(false);

    // Ambil data provinsi saat komponen dimuat
    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const data = await window.ipcRenderer.invoke('get-provinces');
                setProvinces(data);
            } catch (error) {
                console.error('Error fetching provinces:', error);
            }
        };
        fetchProvinces();
    }, []);

    // Ambil data kabupaten ketika provinsi dipilih
    useEffect(() => {
        const fetchRegencies = async () => {
            if (selectedProvince) {
                try {
                    const data = await window.ipcRenderer.invoke('get-regencies', selectedProvince);
                    setRegencies(data);
                    setSelectedRegency("");
                    setDistricts([]);
                    setVillages([]);
                } catch (error) {
                    console.error('Error fetching regencies:', error);
                }
            }
        };
        fetchRegencies();
    }, [selectedProvince]);

    // Ambil data kecamatan ketika kabupaten dipilih
    useEffect(() => {
        const fetchDistricts = async () => {
            if (selectedRegency) {
                try {
                    const data = await window.ipcRenderer.invoke('get-districts', selectedRegency);
                    setDistricts(data);
                    setSelectedDistrict("");
                    setVillages([]);
                } catch (error) {
                    console.error('Error fetching districts:', error);
                }
            }
        };
        fetchDistricts();
    }, [selectedRegency]);

    // Ambil data kelurahan/desa ketika kecamatan dipilih
    useEffect(() => {
        const fetchVillages = async () => {
            if (selectedDistrict) {
                try {
                    const data = await window.ipcRenderer.invoke('get-villages', selectedDistrict);
                    setVillages(data);
                    setSelectedVillage("");
                } catch (error) {
                    console.error('Error fetching villages:', error);
                }
            }
        };
        fetchVillages();
    }, [selectedDistrict]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedProvince) {
            alert('Pilih Provinsi terlebih dahulu');
            return;
        }
        setLoading(true);
        try {
            // Dapatkan nama wilayah yang dipilih
            const provinceName = provinces.find(p => p.id === selectedProvince)?.name || '';
            const regencyName = regencies.find(r => r.id === selectedRegency)?.name || '';
            const districtName = districts.find(d => d.id === selectedDistrict)?.name || '';
            const villageName = villages.find(v => v.id === selectedVillage)?.name || '';
            
            // Gabungkan pencarian dengan wilayah yang dipilih
            let searchQuery = `${name} ${provinceName}`.trim();
            
            // Tambahkan wilayah lain jika dipilih
            if (regencyName) searchQuery = `${name} ${regencyName} ${provinceName}`.trim();
            if (districtName) searchQuery = `${name} ${districtName} ${regencyName} ${provinceName}`.trim();
            if (villageName) searchQuery = `${name} ${villageName} ${districtName} ${regencyName} ${provinceName}`.trim();
            
            // Kirim ke proses scraping
            window.ipcRenderer.send('start-scraping', searchQuery);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="max-w-xl w-full space-y-4" onSubmit={handleSubmit}>
            {/* Dropdown Provinsi */}
            <div className="relative">
                <select
                    className="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    required
                >
                    <option value="">Pilih Provinsi</option>
                    {provinces.map((province) => (
                        <option key={province.id} value={province.id}>
                            {province.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Dropdown Kabupaten (Opsional) */}
            {selectedProvince && (
                <div className="relative">
                    <select
                        className="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        value={selectedRegency}
                        onChange={(e) => setSelectedRegency(e.target.value)}
                    >
                        <option value="">Pilih Kabupaten (Opsional)</option>
                        {regencies.map((regency) => (
                            <option key={regency.id} value={regency.id}>
                                {regency.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Dropdown Kecamatan (Opsional) */}
            {selectedRegency && (
                <div className="relative">
                    <select
                        className="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                    >
                        <option value="">Pilih Kecamatan (Opsional)</option>
                        {districts.map((district) => (
                            <option key={district.id} value={district.id}>
                                {district.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Dropdown Desa/Kelurahan (Opsional) */}
            {selectedDistrict && (
                <div className="relative">
                    <select
                        className="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        value={selectedVillage}
                        onChange={(e) => setSelectedVillage(e.target.value)}
                    >
                        <option value="">Pilih Desa/Kelurahan (Opsional)</option>
                        {villages.map((village) => (
                            <option key={village.id} value={village.id}>
                                {village.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Search Input */}
            <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <svg
                        className="w-4 h-4 text-gray-500 dark:text-gray-400"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 20 20"
                    >
                        <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                        />
                    </svg>
                </div>
                <input
                    type="search"
                    id="search"
                    className="block w-full p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="Cari tempat atau bisnis..."
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <button
                    type="submit"
                    disabled={loading}
                    className={`text-white absolute end-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 ${
                        loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </div>
        </form>
    );
}