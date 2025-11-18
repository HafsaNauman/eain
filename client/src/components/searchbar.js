import { Search } from "lucide-react";

export default function SearchBar({ value, onChange }) {
  return (
    <div className="bg-white rounded-full flex items-center px-4 py-2">
      <Search size={20} className="text-gray-400" />
      <input
        type="text"
        placeholder="Search products..."
        className="ml-2 flex-1 outline-none text-gray-700"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
