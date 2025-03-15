// @ts-ignore: 'React' is declared but its value is never read.
import React, { useState, useEffect } from "react";
import reactLogo from "../assets/react.svg";
import electron from "../assets/electron.svg.png";
import viteLogo from "/electron-vite.animate.svg";
import Table from "./Table";
import Input from "./Input";

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

function App() {
  const [results, setResults] = useState<Place[]>([]);

  useEffect(() => {
    window.ipcRenderer.on("scraping-done", (_event, results) => {
      console.log('Scraping done:', results);
      setResults(results);
    });

    window.ipcRenderer.on("scraping-error", (_event, error) => {
      console.error("Error during scraping:", error);
      // Handle error as needed
    });
  }, []);

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
    window.ipcRenderer.send("delete-place", placeId);
  };

  return (
    <div className="container mx-auto">
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
        <Input />
      </div>
      <div className="flex justify-center items-center my-8">
        <Table places={results} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </div>
  );
}

export default App;