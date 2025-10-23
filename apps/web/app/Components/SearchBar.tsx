"use client";
import { Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function SearchBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded) {
     
      inputRef.current?.focus();
    }
  }, [isExpanded]);

  return (
    <div className="absolute top-3 right-4 mr-10 ">
      <div
        onClick={() => setIsExpanded(true)}
        className={`flex items-center border rounded-full px-2 py-2 transition-all duration-300 overflow-hidden
          ${
            isExpanded
              ? "w-72 bg-white shadow-lg cursor-text"
              : "w-36 bg-white hover:bg-gray-100 cursor-pointer" 
          }`}
      >
        <Search className="text-gray-500 shrink-0 mx-1" size={20} />

        {!isExpanded && (
          <span className="text-gray-400 text-sm ml-1 select-none whitespace-nowrap">
            Search...
          </span>
        )}

        <input
          ref={inputRef}
          type="text"
          placeholder="Search for gigs and more.."
          onBlur={() => setIsExpanded(false)}

         
          className={`bg-transparent outline-none w-full placeholder:text-gray-400 text-black
            ${isExpanded ? "opacity-100 ml-2" : "opacity-0 w-0"}`}
        />
      </div>
    </div>
  );
}

