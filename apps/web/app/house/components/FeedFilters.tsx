import React from "react";
import { Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FilterState {
  posts: boolean;
  gigs: boolean;
  rooms: boolean;
}

interface FeedFiltersProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  filters: FilterState;
  onFilterChange: (key: keyof FilterState) => void;
  menuRef: React.RefObject<HTMLDivElement>;
}

const FilterToggle = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) => (
  <label className="flex items-center space-x-2 cursor-pointer text-sm text-white hover:text-zinc-400 transition-colors">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="form-checkbox h-4 w-4 rounded bg-zinc-700 border-zinc-600 text-white focus:ring-0"
    />
    <span>{label}</span>
  </label>
);

export default function FeedFilters({
  isOpen,
  setIsOpen,
  filters,
  onFilterChange,
  menuRef,
}: FeedFiltersProps) {
  return (
    <div
      className="fixed bottom-5 z-50"
      ref={menuRef}
      style={{ right: `max(1.25rem, calc((100vw - 672px) / 2))` }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-12 h-12 rounded-full text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors shadow-lg cursor-pointer"
      >
        <Filter size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full right-0 mb-4 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 p-4"
          >
            <div className="flex flex-col space-y-3">
              <FilterToggle
                label="Posts"
                checked={filters.posts}
                onChange={() => onFilterChange("posts")}
              />
              <FilterToggle
                label="Gigs"
                checked={filters.gigs}
                onChange={() => onFilterChange("gigs")}
              />
              <FilterToggle
                label="Rooms"
                checked={filters.rooms}
                onChange={() => onFilterChange("rooms")}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
